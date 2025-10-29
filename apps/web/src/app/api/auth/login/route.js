import sql from '@/app/api/utils/sql';

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
    let user = null;
    
    if (phone) {
      const users = await sql`
        SELECT id, name, phone, pension_number, email, date_of_birth, preferred_language, 
               voice_verified, face_verified, document_verified, 
               profile_completed, admin_approved, payment_released
        FROM users 
        WHERE phone = ${phone.trim()}
      `;
      user = users[0] || null;
    } else if (pension_number) {
      const users = await sql`
        SELECT id, name, phone, pension_number, email, date_of_birth, preferred_language, 
               voice_verified, face_verified, document_verified,
               profile_completed, admin_approved, payment_released
        FROM users 
        WHERE pension_number = ${pension_number.trim()}
      `;
      user = users[0] || null;
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
      displayDateOfBirth = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }

    // Log the login attempt
    await sql`
      INSERT INTO audit_logs (user_id, action, details, ip_address)
      VALUES (
        ${user.id}, 
        'LOGIN_ATTEMPT',
        ${JSON.stringify({ login_method: phone ? 'phone' : 'pension_number' })},
        ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}
      )
    `;

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