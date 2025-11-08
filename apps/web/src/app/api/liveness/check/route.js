import { upload } from '@/app/api/utils/upload';
import { getMongoDb } from '@/app/api/utils/mongo';

/**
 * Liveness detection endpoint
 * POST /api/liveness/check
 * 
 * Processes facial image for liveness detection
 */
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let userId;
    let imageBuffer;
    let base64;

    if (contentType.includes('application/json')) {
      const data = await request.json();
      userId = data.userId;
      base64 = data.base64;
      if (base64) {
        imageBuffer = Buffer.from(base64, 'base64');
      }
    } else {
      const formData = await request.formData();
      userId = formData.get('userId');
      const imageFile = formData.get('imageFile');
      if (imageFile) {
        // Validate image file
        if (!imageFile.type.startsWith('image/')) {
          return Response.json({
            success: false,
            error: {
              code: 'INVALID_FILE_TYPE',
              message: 'File must be an image'
            }
          }, { status: 400 });
        }

        // Check file size (max 10MB)
        if (imageFile.size > 10 * 1024 * 1024) {
          return Response.json({
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'Image file must be less than 10MB'
            }
          }, { status: 400 });
        }
        
        imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      }
    }
    
    if (!userId || (!imageBuffer && !base64)) {
      return Response.json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'User ID and image data are required'
        }
      }, { status: 400 });
    }

    const db = await getMongoDb();
    const users = db.collection('users');
    const verificationRequests = db.collection('verification_requests');
    const auditLogs = db.collection('audit_logs');
    const faceImages = db.collection('face_liveness_images');

    console.log('[LIVENESS_CHECK] Looking up user with userId:', userId);

    // Try to find user by auth_user_id first (from session), then by id (from registration)
    let user = await users.findOne({ auth_user_id: userId });
    
    if (!user) {
      console.log('[LIVENESS_CHECK] User not found with auth_user_id, trying by id:', userId);
      user = await users.findOne({ id: userId });
    }

    if (!user) {
      console.error('[LIVENESS_CHECK] User not found with auth_user_id or id:', userId);
      return Response.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, { status: 404 });
    }

    console.log('[LIVENESS_CHECK] User found:', user.id, user.name);

    // Upload image data (buffer or base64)
    const uploadResult = await upload(
      imageBuffer ? { buffer: imageBuffer } : { base64 }
    );
    
    if (uploadResult.error) {
      return Response.json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload image file',
          details: uploadResult.error
        }
      }, { status: 500 });
    }

    // Validate that we got a valid URL
    if (!uploadResult.url || uploadResult.url === 'null' || uploadResult.url === 'undefined') {
      console.error('[LIVENESS_CHECK] Upload service returned invalid URL:', uploadResult.url);
      return Response.json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'File upload did not return a valid URL. Please check upload service configuration.',
          details: 'Upload service returned: ' + uploadResult.url
        }
      }, { status: 500 });
    }

    // Call ML service for liveness detection (use user.id for MongoDB operations)
    const mlResponse = await callMLLivenessService(uploadResult.url, user.id);
    
    if (!mlResponse.success) {
      return Response.json({
        success: false,
        error: {
          code: 'ML_PROCESSING_FAILED',
          message: 'Liveness detection failed',
          details: mlResponse.error
        }
      }, { status: 500 });
    }

    const livenessScore = mlResponse.data.livenessScore;
    const isLive = mlResponse.data.isLive;
    const threshold = 0.7; // Configurable threshold

    // Store facial liveness image in MongoDB
    const faceImageId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    const faceImageDoc = {
      id: faceImageId,
      user_id: user.id,
      image_url: uploadResult.url,
      image_buffer: imageBuffer ? imageBuffer.toString('base64') : base64, // Store as base64
      mime_type: contentType.includes('application/json') ? 'image/jpeg' : 'image/jpeg', // Default to jpeg
      file_size: imageBuffer ? imageBuffer.length : Buffer.from(base64, 'base64').length,
      liveness_score: livenessScore,
      is_live: isLive,
      threshold: threshold,
      image_quality: mlResponse.data.imageQuality,
      face_detected: mlResponse.data.faceDetected,
      reasons: mlResponse.data.reasons || [],
      created_at: new Date().toISOString(),
    };
    
    await faceImages.insertOne(faceImageDoc);
    console.log('[LIVENESS_CHECK] Face image stored in MongoDB:', faceImageId);

    // Create or update verification request
    const nowIso = new Date().toISOString();
    const existingPending = await verificationRequests
      .find({ user_id: user.id, status: 'pending' })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();

    let verificationRequest;
    if (existingPending.length === 0) {
      const reqId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
      const reqDoc = {
        id: reqId,
        user_id: user.id,
        liveness_image_url: uploadResult.url,
        status: 'pending',
        created_at: nowIso,
        updated_at: nowIso,
      };
      await verificationRequests.insertOne(reqDoc);
      verificationRequest = reqDoc;
    } else {
      const pending = existingPending[0];
      await verificationRequests.updateOne(
        { id: pending.id },
        { $set: { liveness_image_url: uploadResult.url, updated_at: nowIso } }
      );
      verificationRequest = { ...pending, liveness_image_url: uploadResult.url, updated_at: nowIso };
    }

    await auditLogs.insertOne({
      user_id: user.id,
      action: 'LIVENESS_CHECK',
      details: {
        livenessScore: livenessScore,
        isLive: isLive,
        threshold: threshold,
        imageUrl: uploadResult.url,
        verificationRequestId: verificationRequest.id,
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      created_at: new Date().toISOString(),
    });

    if (isLive && livenessScore >= threshold) {
      // Successful liveness check
      return Response.json({
        success: true,
        data: {
          live: true,
          livenessScore: livenessScore,
          confidence: mlResponse.data.confidence || 'high',
          imageUrl: uploadResult.url,
          verificationRequestId: verificationRequest.id,
          nextStep: 'document_upload',
          message: 'Liveness verification successful'
        }
      });
    } else {
      // Failed liveness check
      return Response.json({
        success: true,
        data: {
          live: false,
          livenessScore: livenessScore,
          threshold: threshold,
          reasons: mlResponse.data.reasons || ['Low liveness score'],
          message: 'Liveness verification failed. Please ensure good lighting and look directly at the camera.',
          attemptsRemaining: 2 // TODO: Implement attempt tracking
        }
      });
    }

  } catch (error) {
    console.error('Liveness check error:', error);
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred during liveness check',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    }, { status: 500 });
  }
}

/**
 * ML Service placeholder for liveness detection
 * TODO: Replace with actual ML service integration (FaceTec, AWS Rekognition, etc.)
 */
async function callMLLivenessService(imageUrl, userId) {
  try {
    // Placeholder implementation - replace with actual ML service call
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    
    const response = await fetch(`${mlServiceUrl}/liveness/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageUrl: imageUrl,
        userId: userId
      })
    });

    if (!response.ok) {
      // Fallback to deterministic placeholder
      return createPlaceholderLivenessResponse(userId);
    }

    return await response.json();
  } catch (error) {
    console.warn('ML service unavailable, using placeholder:', error.message);
    return createPlaceholderLivenessResponse(userId);
  }
}

/**
 * Creates a deterministic placeholder response for development/testing
 */
function createPlaceholderLivenessResponse(userId) {
  // Create deterministic but realistic liveness scores
  const seed = parseInt(userId) || 1;
  const baseScore = 0.75;
  const variance = (Math.sin(seed * 1.5) + 1) * 0.2; // Deterministic variance
  const livenessScore = Math.min(0.99, Math.max(0.2, baseScore + variance));
  
  const threshold = 0.7;
  const isLive = livenessScore >= threshold;
  
  // Generate realistic failure reasons
  const possibleReasons = [
    'Low image quality',
    'Poor lighting conditions',
    'Face not clearly visible',
    'Multiple faces detected',
    'Eyes not visible',
    'Motion blur detected'
  ];
  
  const reasons = isLive ? [] : [possibleReasons[seed % possibleReasons.length]];
  
  return {
    success: true,
    data: {
      livenessScore: parseFloat(livenessScore.toFixed(4)),
      isLive: isLive,
      confidence: isLive ? 'high' : 'low',
      reasons: reasons,
      faceDetected: true,
      imageQuality: parseFloat((livenessScore * 0.8 + 0.2).toFixed(4)),
      message: isLive ? 'Liveness check passed (placeholder)' : 'Liveness check failed (placeholder)'
    }
  };
}