import { getMongoDb } from '@/app/api/utils/mongo';

/**
 * Voice enrollment status endpoint
 * GET /api/voice/enrollment-status?userId=<userId>
 * 
 * Checks if user has completed voice enrollment
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
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
    const users = db.collection('users');
    const voiceProfiles = db.collection('voice_profiles');

    console.log('[ENROLLMENT_STATUS] Checking enrollment for auth_user_id:', userId);

    // The userId from the session is the auth_user_id
    const user = await users.findOne({ auth_user_id: userId });

    if (!user) {
      console.error('[ENROLLMENT_STATUS] User not found with auth_user_id:', userId);
      return Response.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      }, { status: 404 });
    }

    console.log('[ENROLLMENT_STATUS] User found:', user.id, user.name);

    // Check voice profile
    const voiceProfile = await voiceProfiles.findOne({ user_id: user.id });

    const isEnrolled = !!(voiceProfile?.is_enrolled && voiceProfile?.voice_model_ref);
    const samplesCount = voiceProfile?.enrollment_samples_count || 0;

    console.log('[ENROLLMENT_STATUS] Enrollment status:', {
      isEnrolled,
      samplesCount,
      hasProfile: !!voiceProfile
    });

    return Response.json({
      success: true,
      data: {
        isEnrolled,
        samplesCount,
        samplesRequired: 3,
        voiceModelRef: voiceProfile?.voice_model_ref || null,
        lastEnrollment: voiceProfile?.updated_at || null
      }
    });

  } catch (error) {
    console.error('Enrollment status check error:', error);
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred while checking enrollment status',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    }, { status: 500 });
  }
}
