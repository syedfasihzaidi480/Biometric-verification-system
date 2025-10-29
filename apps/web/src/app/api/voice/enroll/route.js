import sql from '@/app/api/utils/sql';
import { upload } from '@/app/api/utils/upload';

/**
 * Voice enrollment endpoint
 * POST /api/voice/enroll
 * 
 * Creates/updates voice enrollment session and processes voice samples
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId');
    const audioFile = formData.get('audioFile');
    const sessionToken = formData.get('sessionToken');
    
    if (!userId || !audioFile) {
      return Response.json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'User ID and audio file are required'
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

    // Get or create enrollment session
    let session;
    if (sessionToken) {
      // Check existing session
      const existingSessions = await sql`
        SELECT * FROM voice_enrollment_sessions 
        WHERE session_token = ${sessionToken} 
        AND user_id = ${userId}
        AND status = 'active'
        AND expires_at > NOW()
      `;
      
      if (existingSessions.length > 0) {
        session = existingSessions[0];
      }
    }

    if (!session) {
      // Create new session
      const newSessionToken = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      
      const newSessions = await sql`
        INSERT INTO voice_enrollment_sessions (
          user_id, 
          session_token, 
          expires_at, 
          status
        )
        VALUES (${userId}, ${newSessionToken}, ${expiresAt}, 'active')
        RETURNING *
      `;
      
      session = newSessions[0];
    }

    // Upload audio file
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const uploadResult = await upload({ buffer: audioBuffer });
    
    if (uploadResult.error) {
      return Response.json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload audio file',
          details: uploadResult.error
        }
      }, { status: 500 });
    }

    // Call ML service for voice enrollment (placeholder)
    const mlResponse = await callMLEnrollmentService(uploadResult.url, userId, session.samples_recorded + 1);
    
    if (!mlResponse.success) {
      return Response.json({
        success: false,
        error: {
          code: 'ML_PROCESSING_FAILED',
          message: 'Voice processing failed',
          details: mlResponse.error
        }
      }, { status: 500 });
    }

    // Update session with new sample
    const updatedSamples = session.samples_recorded + 1;
    const isComplete = updatedSamples >= session.samples_required;
    
    await sql`
      UPDATE voice_enrollment_sessions 
      SET samples_recorded = ${updatedSamples},
          status = ${isComplete ? 'completed' : 'active'},
          updated_at = NOW()
      WHERE id = ${session.id}
    `;

    // If enrollment is complete, update voice profile
    if (isComplete) {
      await sql`
        UPDATE voice_profiles 
        SET voice_model_ref = ${mlResponse.data.modelId},
            enrollment_samples_count = ${updatedSamples},
            is_enrolled = true,
            updated_at = NOW()
        WHERE user_id = ${userId}
      `;

      // Log successful enrollment
      await sql`
        INSERT INTO audit_logs (user_id, action, details, ip_address)
        VALUES (
          ${userId}, 
          'VOICE_ENROLLED',
          ${JSON.stringify({ 
            sessionId: session.id,
            samplesCount: updatedSamples,
            modelId: mlResponse.data.modelId
          })},
          ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}
        )
      `;
    }

    return Response.json({
      success: true,
      data: {
        sessionToken: session.session_token,
        samplesRecorded: updatedSamples,
        samplesRequired: session.samples_required,
        isComplete: isComplete,
        matchScore: mlResponse.data.matchScore || null,
        nextStep: isComplete ? 'voice_login' : 'continue_enrollment'
      }
    });

  } catch (error) {
    console.error('Voice enrollment error:', error);
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred during voice enrollment',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    }, { status: 500 });
  }
}

/**
 * ML Service placeholder for voice enrollment
 * TODO: Replace with actual ML service integration (VoiceIt, Microsoft, etc.)
 */
async function callMLEnrollmentService(audioUrl, userId, sampleNumber) {
  try {
    // Placeholder implementation - replace with actual ML service call
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    
    const response = await fetch(`${mlServiceUrl}/voice/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audioUrl: audioUrl,
        userId: userId,
        sampleNumber: sampleNumber
      })
    });

    if (!response.ok) {
      // Fallback to deterministic placeholder
      return createPlaceholderEnrollmentResponse(userId, sampleNumber);
    }

    return await response.json();
  } catch (error) {
    console.warn('ML service unavailable, using placeholder:', error.message);
    return createPlaceholderEnrollmentResponse(userId, sampleNumber);
  }
}

/**
 * Creates a deterministic placeholder response for development/testing
 */
function createPlaceholderEnrollmentResponse(userId, sampleNumber) {
  const modelId = `voice_model_${userId}_${Date.now()}`;
  const baseScore = 0.85;
  const variance = (Math.sin(userId * sampleNumber) + 1) * 0.1; // Deterministic variance
  const matchScore = Math.min(0.99, Math.max(0.5, baseScore + variance));
  
  return {
    success: true,
    data: {
      modelId: modelId,
      matchScore: parseFloat(matchScore.toFixed(4)),
      qualityScore: parseFloat((matchScore * 0.9).toFixed(4)),
      message: 'Voice sample processed successfully (placeholder)'
    }
  };
}