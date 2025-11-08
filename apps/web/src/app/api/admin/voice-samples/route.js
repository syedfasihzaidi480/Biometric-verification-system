import { getMongoDb } from '@/app/api/utils/mongo';

/**
 * Admin endpoint to retrieve voice samples
 * GET /api/admin/voice-samples?userId=xxx&type=enrollment|verification
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'enrollment'; // 'enrollment' or 'verification'

    if (!userId) {
      return Response.json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'User ID is required'
        }
      }, { status: 400 });
    }

    const db = await getMongoDb();
    
    let samples;
    if (type === 'enrollment') {
      const collection = db.collection('voice_enrollment_samples');
      samples = await collection
        .find({ user_id: userId })
        .sort({ created_at: -1 })
        .toArray();
    } else if (type === 'verification') {
      const collection = db.collection('voice_verification_samples');
      samples = await collection
        .find({ user_id: userId })
        .sort({ created_at: -1 })
        .toArray();
    } else {
      return Response.json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Type must be either "enrollment" or "verification"'
        }
      }, { status: 400 });
    }

    // Remove audio_buffer from response (too large) but keep metadata
    const samplesWithoutBuffer = samples.map(sample => {
      const { audio_buffer, ...rest } = sample;
      return {
        ...rest,
        has_audio_buffer: !!audio_buffer,
        audio_buffer_size: audio_buffer ? audio_buffer.length : 0
      };
    });

    return Response.json({
      success: true,
      data: {
        type,
        userId,
        count: samplesWithoutBuffer.length,
        samples: samplesWithoutBuffer
      }
    });

  } catch (error) {
    console.error('Voice samples retrieval error:', error);
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    }, { status: 500 });
  }
}

/**
 * Admin endpoint to retrieve a specific voice sample with audio data
 * POST /api/admin/voice-samples
 * Body: { sampleId: string, type: 'enrollment' | 'verification', includeAudio: boolean }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { sampleId, type, includeAudio } = body;

    if (!sampleId || !type) {
      return Response.json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Sample ID and type are required'
        }
      }, { status: 400 });
    }

    const db = await getMongoDb();
    
    let sample;
    if (type === 'enrollment') {
      const collection = db.collection('voice_enrollment_samples');
      sample = await collection.findOne({ id: sampleId });
    } else if (type === 'verification') {
      const collection = db.collection('voice_verification_samples');
      sample = await collection.findOne({ id: sampleId });
    } else {
      return Response.json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Type must be either "enrollment" or "verification"'
        }
      }, { status: 400 });
    }

    if (!sample) {
      return Response.json({
        success: false,
        error: {
          code: 'SAMPLE_NOT_FOUND',
          message: 'Voice sample not found'
        }
      }, { status: 404 });
    }

    // Optionally exclude audio buffer for lighter response
    if (!includeAudio) {
      const { audio_buffer, ...rest } = sample;
      return Response.json({
        success: true,
        data: {
          ...rest,
          has_audio_buffer: !!audio_buffer,
          audio_buffer_size: audio_buffer ? audio_buffer.length : 0
        }
      });
    }

    return Response.json({
      success: true,
      data: sample
    });

  } catch (error) {
    console.error('Voice sample retrieval error:', error);
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    }, { status: 500 });
  }
}
