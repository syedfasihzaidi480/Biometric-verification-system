import sql from '@/app/api/utils/sql';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = session.user.id;

    // Get user profile from our users table
    const userProfile = await sql`
      SELECT 
        id,
        auth_user_id,
        name,
        phone,
        email,
        date_of_birth,
        preferred_language,
        role,
        profile_completed,
        voice_verified,
        face_verified,
        document_verified,
        admin_approved,
        payment_released,
        created_at,
        updated_at
      FROM users 
      WHERE auth_user_id = ${authUserId}
      LIMIT 1
    `;

    // If no profile exists, create a minimal one
    if (userProfile.length === 0) {
      const newProfile = await sql`
        INSERT INTO users (
          auth_user_id,
          name,
          email,
          preferred_language,
          role,
          profile_completed,
          created_at,
          updated_at
        ) VALUES (
          ${authUserId},
          ${session.user.name || ''},
          ${session.user.email || ''},
          'en',
          'user',
          FALSE,
          NOW(),
          NOW()
        )
        RETURNING 
          id,
          auth_user_id,
          name,
          phone,
          email,
          date_of_birth,
          preferred_language,
          role,
          profile_completed,
          voice_verified,
          face_verified,
          document_verified,
          admin_approved,
          payment_released,
          created_at,
          updated_at
      `;
      
      return Response.json({ 
        success: true,
        user: newProfile[0]
      });
    }

    return Response.json({ 
      success: true,
      user: userProfile[0]
    });

  } catch (error) {
    console.error("GET /api/profile error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = session.user.id;
    const body = await request.json();

    const { 
      name,
      phone, 
      date_of_birth,
      preferred_language,
      profile_completed,
      voice_verified,
      face_verified,
      document_verified
    } = body;

    // Build dynamic update query
    const setClauses = [];
    const values = [];

    if (typeof name === 'string' && name.trim().length > 0) {
      setClauses.push(`name = $${values.length + 1}`);
      values.push(name.trim());
    }

    if (typeof phone === 'string' && phone.trim().length > 0) {
      setClauses.push(`phone = $${values.length + 1}`);
      values.push(phone.trim());
    }

    if (typeof date_of_birth === 'string' && date_of_birth.trim().length > 0) {
      setClauses.push(`date_of_birth = $${values.length + 1}`);
      values.push(date_of_birth.trim());
    }

    if (typeof preferred_language === 'string' && preferred_language.trim().length > 0) {
      setClauses.push(`preferred_language = $${values.length + 1}`);
      values.push(preferred_language.trim());
    }

    if (typeof profile_completed === 'boolean') {
      setClauses.push(`profile_completed = $${values.length + 1}`);
      values.push(profile_completed);
    }

    if (typeof voice_verified === 'boolean') {
      setClauses.push(`voice_verified = $${values.length + 1}`);
      values.push(voice_verified);
    }

    if (typeof face_verified === 'boolean') {
      setClauses.push(`face_verified = $${values.length + 1}`);
      values.push(face_verified);
    }

    if (typeof document_verified === 'boolean') {
      setClauses.push(`document_verified = $${values.length + 1}`);
      values.push(document_verified);
    }

    if (setClauses.length === 0) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Always update the updated_at timestamp
    setClauses.push(`updated_at = NOW()`);

    const updateQuery = `
      UPDATE users 
      SET ${setClauses.join(', ')} 
      WHERE auth_user_id = $${values.length + 1}
      RETURNING 
        id,
        auth_user_id,
        name,
        phone,
        email,
        date_of_birth,
        preferred_language,
        role,
        profile_completed,
        voice_verified,
        face_verified,
        document_verified,
        admin_approved,
        payment_released,
        created_at,
        updated_at
    `;

    const result = await sql(updateQuery, [...values, authUserId]);
    const updatedUser = result?.[0] || null;

    if (!updatedUser) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Log the update
    await sql`
      INSERT INTO audit_logs (user_id, action, details, ip_address, created_at)
      VALUES (
        ${updatedUser.id},
        'PROFILE_UPDATED',
        ${JSON.stringify({ 
          fieldsUpdated: setClauses.filter(clause => !clause.includes('updated_at')),
          authUserId: authUserId
        })},
        ${request.headers.get('x-forwarded-for') || 'unknown'},
        NOW()
      )
    `;

    return Response.json({ 
      success: true,
      user: updatedUser
    });

  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}