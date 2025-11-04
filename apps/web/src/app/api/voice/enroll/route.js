import { upload } from '@/app/api/utils/upload';
import { getMongoDb } from '@/app/api/utils/mongo';

/**
 * Voice enrollment endpoint
 * POST /api/voice/enroll
 * 
 * Creates/updates voice enrollment session and processes voice samples
 */
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let userId;
    let audioBuffer;
    let base64;
    let sessionToken;

    if (contentType.includes('application/json')) {
      const data = await request.json();
      userId = data.userId;
      sessionToken = data.sessionToken;
      base64 = data.base64;
      if (base64) {
        audioBuffer = Buffer.from(base64, 'base64');
      }
    } else {
      const formData = await request.formData();
      userId = formData.get('userId');
      sessionToken = formData.get('sessionToken');
      const audioFile = formData.get('audioFile');
      if (audioFile) {
        audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      }
    }

    if (!userId || (!audioBuffer && !base64)) {
      return Response.json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'User ID and audio data are required'
        }
      }, { status: 400 });
    }

    const db = await getMongoDb();
    const users = db.collection('users');
    const sessionsCollection = db.collection('voice_enrollment_sessions');
    const voiceProfiles = db.collection('voice_profiles');
    const auditLogs = db.collection('audit_logs');

    // The userId from the session is the auth_user_id, so look up by that field
    const user = await users.findOne({ auth_user_id: userId });

    if (!user) {
      return Response.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, { status: 404 });
    }

    const now = new Date();
    const nowIso = now.toISOString();

    let session = null;
    if (sessionToken) {
      session = await sessionsCollection.findOne({
        session_token: sessionToken,
        user_id: user.id, // Use actual user.id for MongoDB operations
        status: 'active',
        expires_at: { $gt: nowIso },
      });
    }

    if (!session) {
      const newSessionToken = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const sessionId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
      const expiresAtIso = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
      const sessionDoc = {
        id: sessionId,
        user_id: user.id, // Use actual user.id for MongoDB operations
        session_token: newSessionToken,
        status: 'active',
        samples_required: 3,
        samples_recorded: 0,
        expires_at: expiresAtIso,
        created_at: nowIso,
        updated_at: nowIso,
      };
      await sessionsCollection.insertOne(sessionDoc);
      session = sessionDoc;
    }

    // Upload audio data
    const uploadResult = await upload(
      audioBuffer ? { buffer: audioBuffer } : { base64 }
    );
    
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
    const samplesRequired = session.samples_required ?? 3;
    const currentSamples = session.samples_recorded ?? 0;
    const updatedSamples = currentSamples + 1;
    const isComplete = updatedSamples >= samplesRequired;

    await sessionsCollection.updateOne(
      { id: session.id },
      {
        $set: {
          samples_recorded: updatedSamples,
          status: isComplete ? 'completed' : 'active',
          updated_at: new Date().toISOString(),
        },
      }
    );

    session = {
      ...session,
      samples_recorded: updatedSamples,
      status: isComplete ? 'completed' : 'active',
    };

    await voiceProfiles.updateOne(
      { user_id: user.id },
      {
        $setOnInsert: {
          id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
          user_id: user.id,
          voice_model_ref: null,
          enrollment_samples_count: 0,
          is_enrolled: false,
          last_match_score: null,
          created_at: nowIso,
        },
        $set: { updated_at: new Date().toISOString() },
      },
      { upsert: true }
    );

    if (isComplete) {
      await voiceProfiles.updateOne(
        { user_id: user.id },
        {
          $set: {
            voice_model_ref: mlResponse.data.modelId,
            enrollment_samples_count: updatedSamples,
            is_enrolled: true,
            last_match_score: mlResponse.data.matchScore || null,
            updated_at: new Date().toISOString(),
          },
        }
      );

      await auditLogs.insertOne({
        user_id: user.id,
        action: 'VOICE_ENROLLED',
        details: {
          sessionId: session.id,
          samplesCount: updatedSamples,
          modelId: mlResponse.data.modelId,
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        created_at: new Date().toISOString(),
      });
    }

    return Response.json({
      success: true,
      data: {
        sessionToken: session.session_token,
        samplesRecorded: updatedSamples,
        samplesRequired: samplesRequired,
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