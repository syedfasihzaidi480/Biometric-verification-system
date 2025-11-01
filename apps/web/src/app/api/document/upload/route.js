import { upload } from '@/app/api/utils/upload';
import { auth } from '@/auth';
import { getMongoDb } from '@/app/api/utils/mongo';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/heic',
  'image/heif',
];

function isMimeTypeAllowed(mimeType) {
  if (!mimeType) return true;
  if (mimeType.startsWith('image/')) return true;
  return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase());
}

/**
 * Document upload endpoint
 * POST /api/document/upload
 * 
 * Uploads and processes identity document
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ 
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      }, { status: 401 });
    }

    const authUserId = session.user.id;
    let documentType = 'id_card';
    let uploadResult = null;
    let uploadedFileMeta = { mimeType: null, fileName: null };

    // Support both multipart/form-data and JSON bodies (base64 or URL)
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      documentType = body.documentType || 'id_card';
      const mimeType = typeof body.documentMimeType === 'string' ? body.documentMimeType : null;
      const fileName = typeof body.documentFileName === 'string' ? body.documentFileName : null;

      if (mimeType && !isMimeTypeAllowed(mimeType)) {
        return Response.json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Unsupported document format. Please upload an image or PDF file.',
          },
        }, { status: 400 });
      }

      if (body.documentBase64) {
        uploadResult = await upload({ base64: body.documentBase64 });
        uploadedFileMeta = {
          mimeType: mimeType || uploadResult?.mimeType || null,
          fileName: fileName || null,
        };
      } else if (body.documentUrl) {
        uploadResult = await upload({ url: body.documentUrl });
        uploadedFileMeta = {
          mimeType: mimeType || uploadResult?.mimeType || null,
          fileName: fileName || null,
        };
      } else {
        return Response.json({
          success: false,
          error: { code: 'MISSING_REQUIRED_FIELDS', message: 'documentBase64 or documentUrl is required' }
        }, { status: 400 });
      }
    } else {
      // Multipart form-data path (mobile clients may send files this way)
      const formData = await request.formData();
      const documentFile = formData.get('documentFile');
      documentType = formData.get('documentType') || 'id_card';

      if (!documentFile) {
        return Response.json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Document file is required'
          }
        }, { status: 400 });
      }

      // Validate document file
      if (!isMimeTypeAllowed(documentFile.type)) {
        return Response.json({
          success: false,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Document must be an image or PDF'
          }
        }, { status: 400 });
      }

      // Check file size (max 15MB for documents)
      if (documentFile.size > 15 * 1024 * 1024) {
        return Response.json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'Document file must be less than 15MB'
          }
        }, { status: 400 });
      }

      // Upload document file
      const documentBuffer = Buffer.from(await documentFile.arrayBuffer());
      uploadResult = await upload({ buffer: documentBuffer });
      uploadedFileMeta = {
        mimeType: documentFile.type || uploadResult?.mimeType || null,
        fileName: documentFile.name || null,
      };
    }

    const db = await getMongoDb();
    const users = db.collection('users');
    const documents = db.collection('documents');
    const verificationRequests = db.collection('verification_requests');
    const auditLogs = db.collection('audit_logs');

    let user = await users.findOne({ auth_user_id: authUserId });
    if (!user) {
      const now = new Date().toISOString();
      const doc = {
        id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
        auth_user_id: authUserId,
        name: session.user.name || '',
        email: session.user.email || '',
        phone: null,
        date_of_birth: null,
        preferred_language: 'en',
        role: 'user',
        profile_completed: false,
        voice_verified: false,
        face_verified: false,
        document_verified: false,
        admin_approved: false,
        payment_released: false,
        created_at: now,
        updated_at: now,
      };
      await users.insertOne(doc);
      user = doc;
    }

    // Validate document type
    const validDocumentTypes = ['id_card', 'passport', 'drivers_license', 'national_id', 'other'];
    if (!validDocumentTypes.includes(documentType)) {
      return Response.json({
        success: false,
        error: {
          code: 'INVALID_DOCUMENT_TYPE',
          message: 'Invalid document type'
        }
      }, { status: 400 });
    }

    if (uploadResult.error) {
      return Response.json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload document file',
          details: uploadResult.error
        }
      }, { status: 500 });
    }

    // Call ML service for document verification
    const mlResponse = await callMLDocumentService(uploadResult.url, documentType, user.id);
    
    if (!mlResponse.success) {
      return Response.json({
        success: false,
        error: {
          code: 'ML_PROCESSING_FAILED',
          message: 'Document processing failed',
          details: mlResponse.error
        }
      }, { status: 500 });
    }

  let document;
  let verificationRequest;

  const nowIso = new Date().toISOString();
    const documentId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    const docData = {
      id: documentId,
      user_id: user.id,
      document_type: documentType,
      document_text: mlResponse.data.extractedText || null,
      document_image_url: uploadResult.url,
      tamper_flag: mlResponse.data.tamperDetected || false,
      mime_type: uploadedFileMeta.mimeType,
      original_file_name: uploadedFileMeta.fileName,
      created_at: nowIso,
    };
    await documents.insertOne(docData);
    document = docData;

    const existingPending = await verificationRequests
      .find({ user_id: user.id, status: 'pending' })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();

    const pendingRequest = existingPending[0];
    if (!pendingRequest) {
      const reqId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
      const reqData = {
        id: reqId,
        user_id: user.id,
        document_url: uploadResult.url,
        status: 'pending',
        created_at: nowIso,
        updated_at: nowIso,
      };
      await verificationRequests.insertOne(reqData);
      verificationRequest = reqData;
    } else {
      await verificationRequests.updateOne(
        { id: pendingRequest.id },
        { $set: { document_url: uploadResult.url, updated_at: nowIso } }
      );
      verificationRequest = { ...pendingRequest, document_url: uploadResult.url, updated_at: nowIso };
    }

    await auditLogs.insertOne({
      user_id: user.id,
      action: 'DOCUMENT_UPLOADED',
      details: {
        documentId: document.id,
        documentType: documentType,
        tamperDetected: mlResponse.data.tamperDetected,
        verificationRequestId: verificationRequest.id,
        ocrConfidence: mlResponse.data.ocrConfidence,
        mimeType: uploadedFileMeta.mimeType,
        fileName: uploadedFileMeta.fileName,
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      created_at: new Date().toISOString(),
    });

    const tamperDetected = mlResponse.data.tamperDetected || false;
    const ocrConfidence = mlResponse.data.ocrConfidence || 0;

    return Response.json({
      success: true,
      data: {
        documentId: document.id,
        documentUrl: uploadResult.url,
        extractedText: mlResponse.data.extractedText,
        tamperDetected: tamperDetected,
        ocrConfidence: ocrConfidence,
        verificationRequestId: verificationRequest.id,
        status: tamperDetected ? 'flagged' : 'processed',
        message: tamperDetected 
          ? 'Document uploaded but potential tampering detected'
          : 'Document uploaded and processed successfully',
        nextStep: 'verification_complete'
      }
    });

  } catch (error) {
    console.error('Document upload error:', error);
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred during document upload',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    }, { status: 500 });
  }
}

/**
 * ML Service placeholder for document verification
 * TODO: Replace with actual ML service integration (AWS Textract, Google Vision, etc.)
 */
async function callMLDocumentService(documentUrl, documentType, userId) {
  try {
    // Placeholder implementation - replace with actual ML service call
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    
    const response = await fetch(`${mlServiceUrl}/document/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentUrl: documentUrl,
        documentType: documentType,
        userId: userId
      })
    });

    if (!response.ok) {
      // Fallback to deterministic placeholder
      return createPlaceholderDocumentResponse(userId, documentType);
    }

    return await response.json();
  } catch (error) {
    console.warn('ML service unavailable, using placeholder:', error.message);
    return createPlaceholderDocumentResponse(userId, documentType);
  }
}

/**
 * Creates a deterministic placeholder response for development/testing
 */
function createPlaceholderDocumentResponse(userId, documentType) {
  const seed = parseInt(userId) || 1;
  
  // Generate realistic extracted text based on document type
  const documentTexts = {
    'id_card': `ID: ${1000000 + seed}\\nName: John Doe\\nDOB: 1990-01-01\\nExpiry: 2030-12-31`,
    'passport': `Passport: P${seed}\\nName: John Doe\\nNationality: Country\\nDOB: 1990-01-01\\nExpiry: 2030-12-31`,
    'drivers_license': `License: DL${seed}\\nName: John Doe\\nDOB: 1990-01-01\\nClass: C\\nExpiry: 2030-12-31`,
    'national_id': `National ID: N${seed}\\nName: John Doe\\nDOB: 1990-01-01\\nIssued: 2020-01-01`,
    'other': `Document ID: ${seed}\\nName: John Doe`
  };

  // Deterministic tamper detection (5% chance based on user ID)
  const tamperDetected = (seed % 20) === 0;
  
  // OCR confidence based on seed
  const baseConfidence = 0.85;
  const variance = (Math.sin(seed * 2.1) + 1) * 0.1;
  const ocrConfidence = Math.min(0.99, Math.max(0.5, baseConfidence + variance));

  return {
    success: true,
    data: {
      extractedText: documentTexts[documentType] || documentTexts.other,
      tamperDetected: tamperDetected,
      ocrConfidence: parseFloat(ocrConfidence.toFixed(4)),
      documentQuality: tamperDetected ? 0.3 : parseFloat((ocrConfidence * 0.9).toFixed(4)),
      faceRegionDetected: Math.random() > 0.2, // 80% chance of face detection
      message: tamperDetected 
        ? 'Potential document tampering detected (placeholder)'
        : 'Document processed successfully (placeholder)'
    }
  };
}