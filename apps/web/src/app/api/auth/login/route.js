import { getMongoDb } from '@/app/api/utils/mongo';

/**
 * User login endpoint
 * POST /api/auth/login
 * 
 * Accepts: { phone: "..." } OR { pension_number: "..." }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, pension_number } = body;

    // Validate that at least one login method is provided
    if (!phone && !pension_number) {
      return Response.json({
        success: false,
        error: {
          code: 'MISSING_LOGIN_FIELD',
          message: 'Please provide either phone number or pension number',
          details: {}
        }
      }, { status: 400 });
    }

    // Find user by phone or pension number
    const db = await getMongoDb();
    const usersCollection = db.collection('users');
    const auditLogs = db.collection('audit_logs');

    let user = null;

    if (phone) {
      user = await usersCollection.findOne({ phone: phone.trim() });
    } else if (pension_number) {
      user = await usersCollection.findOne({ pension_number: pension_number.trim() });
    }

    if (!user) {
      return Response.json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No account found with these credentials',
          details: {}
        }
      }, { status: 404 });
    }

    // Format date of birth for display (DD/MM/YYYY)
    let displayDateOfBirth = null;
    if (user.date_of_birth) {
      const date = new Date(user.date_of_birth);
      if (!Number.isNaN(date.getTime())) {
        displayDateOfBirth = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      }
    }

    await auditLogs.insertOne({
      user_id: user.id,
      action: 'LOGIN_ATTEMPT',
      details: { login_method: phone ? 'phone' : 'pension_number' },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      created_at: new Date().toISOString(),
    });

    // Return user data for voice verification
    return Response.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          pension_number: user.pension_number,
          email: user.email,
          date_of_birth: displayDateOfBirth,
          preferred_language: user.preferred_language,
          verification_status: {
            voice_verified: user.voice_verified,
            face_verified: user.face_verified,
            document_verified: user.document_verified,
            profile_completed: user.profile_completed,
            admin_approved: user.admin_approved,
            payment_released: user.payment_released
          }
        },
        next_step: 'voice_verification'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred during login',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    }, { status: 500 });
  }
}