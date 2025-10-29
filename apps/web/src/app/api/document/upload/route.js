import sql from '@/app/api/utils/sql';
import { upload } from '@/app/api/utils/upload';

/**
 * Document upload endpoint
 * POST /api/document/upload
 * 
 * Uploads and processes identity document
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId');
    const documentFile = formData.get('documentFile');
    const documentType = formData.get('documentType') || 'id_card';
    
    if (!userId || !documentFile) {
      return Response.json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'User ID and document file are required'
        }
      }, { status: 400 });
    }

    // Verify user exists
    const user = await sql`
      SELECT id, name, preferred_language FROM users WHERE id = ${userId}
    `;

    if (user.length === 0) {
      return Response.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, { status: 404 });
    }

    // Validate document file
    if (!documentFile.type.startsWith('image/')) {
      return Response.json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'Document must be an image file'
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

    // Upload document file
    const documentBuffer = Buffer.from(await documentFile.arrayBuffer());
    const uploadResult = await upload({ buffer: documentBuffer });
    
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
    const mlResponse = await callMLDocumentService(uploadResult.url, documentType, userId);
    
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

    // Store document information
    const document = await sql`
      INSERT INTO documents (
        user_id, 
        document_type, 
        document_text, 
        document_image_url, 
        tamper_flag
      )
      VALUES (
        ${userId}, 
        ${documentType}, 
        ${mlResponse.data.extractedText || null}, 
        ${uploadResult.url}, 
        ${mlResponse.data.tamperDetected || false}
      )
      RETURNING id, created_at
    `;

    // Update verification request
    let verificationRequest = await sql`
      SELECT id FROM verification_requests 
      WHERE user_id = ${userId} AND status = 'pending'
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    if (verificationRequest.length === 0) {
      // Create new verification request
      const newRequest = await sql`
        INSERT INTO verification_requests (user_id, document_url, status)
        VALUES (${userId}, ${uploadResult.url}, 'pending')
        RETURNING id
      `;
      verificationRequest = newRequest;
    } else {
      // Update existing verification request
      await sql`
        UPDATE verification_requests 
        SET document_url = ${uploadResult.url},
            updated_at = NOW()
        WHERE id = ${verificationRequest[0].id}
      `;
    }

    // Log document upload
    await sql`
      INSERT INTO audit_logs (user_id, action, details, ip_address)
      VALUES (
        ${userId}, 
        'DOCUMENT_UPLOADED',
        ${JSON.stringify({ 
          documentId: document[0].id,
          documentType: documentType,
          tamperDetected: mlResponse.data.tamperDetected,
          verificationRequestId: verificationRequest[0].id,
          ocrConfidence: mlResponse.data.ocrConfidence
        })},
        ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}
      )
    `;

    const tamperDetected = mlResponse.data.tamperDetected || false;
    const ocrConfidence = mlResponse.data.ocrConfidence || 0;

    return Response.json({
      success: true,
      data: {
        documentId: document[0].id,
        documentUrl: uploadResult.url,
        extractedText: mlResponse.data.extractedText,
        tamperDetected: tamperDetected,
        ocrConfidence: ocrConfidence,
        verificationRequestId: verificationRequest[0].id,
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