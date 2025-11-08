import { getMongoDb } from '@/app/api/utils/mongo';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      console.error('[Profile GET] No session or user ID');
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = session.user.id;
    console.log('[Profile GET] Auth user ID:', authUserId);
    
    const db = await getMongoDb();
    const users = db.collection('users');
    let user = await users.findOne({ auth_user_id: authUserId });

    if (!user) {
      console.log('[Profile GET] User not found, creating new user');
      const now = new Date().toISOString();
      const newUserId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
      const doc = {
        id: newUserId,
        auth_user_id: authUserId,
        name: session.user.name || '',
        email: (session.user.email ? String(session.user.email).toLowerCase() : ''),
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
      
      console.log('[Profile GET] Creating user doc:', JSON.stringify(doc, null, 2));
      
      try {
        await users.insertOne(doc);
        user = doc;
        console.log('[Profile GET] User created successfully');
      } catch (insertError) {
        console.error('[Profile GET] Insert failed:', insertError);
        // Try to fetch again in case of race condition
        user = await users.findOne({ auth_user_id: authUserId });
        if (!user) {
          throw insertError;
        }
      }
    } else {
      console.log('[Profile GET] User found:', user.id);
    }

    return Response.json({ success: true, user });

  } catch (error) {
    console.error("[Profile GET] Error:", error);
    console.error("[Profile GET] Stack:", error.stack);
    return Response.json(
      {
        error: process.env.NODE_ENV === 'development' ? (error?.message || 'Internal Server Error') : 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      console.error('[Profile PUT] No session or user ID');
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = session.user.id;
    console.log('[Profile PUT] Auth user ID:', authUserId);
    
    const body = await request.json();
    console.log('[Profile PUT] Request body:', JSON.stringify(body, null, 2));

    const { 
      name,
      phone, 
      date_of_birth,
      preferred_language,
      profile_completed,
      voice_verified,
      face_verified,
      document_verified,
      email,
    } = body;

    const db = await getMongoDb();
    const users = db.collection('users');
    const auditLogs = db.collection('audit_logs');

    const now = new Date().toISOString();
    
    // Build complete user document with all fields
    const userData = {
      auth_user_id: authUserId,
      updated_at: now,
    };

  // Add fields from request body
    if (typeof name === 'string' && name.trim()) userData.name = name.trim();
    if (typeof phone === 'string' && phone.trim()) userData.phone = phone.trim();
    if (typeof date_of_birth === 'string' && date_of_birth.trim()) userData.date_of_birth = date_of_birth.trim();
    if (typeof preferred_language === 'string' && preferred_language.trim()) userData.preferred_language = preferred_language.trim();
    if (typeof profile_completed === 'boolean') userData.profile_completed = profile_completed;
    if (typeof voice_verified === 'boolean') userData.voice_verified = voice_verified;
    if (typeof face_verified === 'boolean') userData.face_verified = face_verified;
    if (typeof document_verified === 'boolean') userData.document_verified = document_verified;
  if (typeof email === 'string' && email.trim()) userData.email = email.trim().toLowerCase();

    // Check if only updated_at would be set
    if (Object.keys(userData).length === 2) { // auth_user_id + updated_at only
      console.error('[Profile PUT] No valid fields to update');
      return Response.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    console.log('[Profile PUT] User data to save:', JSON.stringify(userData, null, 2));

    // First, try to find existing user
    let existingUser = await users.findOne({ auth_user_id: authUserId });
    console.log('[Profile PUT] Existing user:', existingUser ? 'Found' : 'Not found');

    if (existingUser) {
      // Update existing user
      const updateResult = await users.updateOne(
        { auth_user_id: authUserId },
        { $set: userData }
      );
      console.log('[Profile PUT] Update result:', updateResult.modifiedCount, 'modified');
    } else {
      // Create new user with complete data
      const newUserId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
      const newUserDoc = {
        id: newUserId,
        auth_user_id: authUserId,
        name: userData.name || '',
        // Prefer explicitly provided email (already normalized to lowercase); fall back to session email
        email: userData.email || (session?.user?.email ? String(session.user.email).toLowerCase() : ''),
        preferred_language: userData.preferred_language || 'en',
        role: 'user',
        profile_completed: userData.profile_completed ?? false,
        voice_verified: userData.voice_verified ?? false,
        face_verified: userData.face_verified ?? false,
        document_verified: userData.document_verified ?? false,
        admin_approved: false,
        payment_released: false,
        created_at: now,
        updated_at: now,
      };
      // Only include optional fields if actually provided to avoid indexing nulls
      if (userData.phone) newUserDoc.phone = userData.phone;
      if (userData.date_of_birth) newUserDoc.date_of_birth = userData.date_of_birth;
      
      console.log('[Profile PUT] Creating new user:', JSON.stringify(newUserDoc, null, 2));
      await users.insertOne(newUserDoc);
      existingUser = newUserDoc;
    }

    // If email provided, also update auth user's email so they can sign in with it
    if (typeof userData.email === 'string' && userData.email.trim()) {
      const normalizedEmail = userData.email.trim().toLowerCase();
      const authUsers = db.collection('auth_users');
      // Prevent duplicate emails pointing to different auth users
      const emailInUse = await authUsers.findOne({ email: normalizedEmail, id: { $ne: authUserId } });
      if (emailInUse) {
        console.error('[Profile PUT] Email already in use by another account');
        return Response.json({ error: 'Email already in use' }, { status: 409 });
      }
      await authUsers.updateOne(
        { id: authUserId },
        { $set: { email: normalizedEmail } }
      );
    }

    // Fetch the updated/created user
    const user = await users.findOne({ auth_user_id: authUserId });
    
    if (!user) {
      console.error('[Profile PUT] User still not found after upsert!');
      return Response.json({ 
        error: 'Failed to save profile. Please try again.',
        details: 'User document could not be created or retrieved'
      }, { status: 500 });
    }

    console.log('[Profile PUT] Final user:', JSON.stringify(user, null, 2));

    // Log audit trail
    try {
      await auditLogs.insertOne({
        user_id: user.id,
        action: 'PROFILE_UPDATED',
        details: { 
          fieldsUpdated: Object.keys(userData).filter((field) => field !== 'updated_at' && field !== 'auth_user_id'), 
          authUserId 
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        created_at: new Date().toISOString(),
      });
    } catch (auditError) {
      console.error('[Profile PUT] Audit log failed:', auditError);
      // Don't fail the request if audit fails
    }

    return Response.json({ success: true, user });

  } catch (error) {
    console.error("[Profile PUT] Error:", error);
    console.error("[Profile PUT] Stack:", error.stack);
    return Response.json(
      {
        error: process.env.NODE_ENV === 'development' ? (error?.message || 'Internal Server Error') : 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Allow partial updates via PATCH (same handler as PUT)
export async function PATCH(request) {
  return PUT(request);
}