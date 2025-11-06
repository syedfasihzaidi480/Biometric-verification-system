import { getMongoDb } from "@/app/api/utils/mongo";
import { hash } from "argon2";

/**
 * User registration endpoint
 * POST /api/auth/register
 *
 * Required: name, phone, pension_number, password
 * Optional: email, date_of_birth, preferred_language
 */
export async function POST(request) {
  try {
    console.log('[REGISTER] Registration request received');
    const body = await request.json();
    console.log('[REGISTER] Request body:', { ...body, password: body.password ? '***' : undefined });

    const {
      name,
      phone,
      email,
      password,
      date_of_birth,
      pension_number,
      preferred_language = "en",
    } = body;

    if (!name || !phone || !pension_number || !password) {
      return Response.json(
        {
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Name, phone number, pension number, and password are required",
            details: {
              name: !name ? "Name is required" : null,
              phone: !phone ? "Phone number is required" : null,
              pension_number: !pension_number ? "Pension number is required" : null,
              password: !password ? "Password is required" : null,
            },
          },
        },
        { status: 400 },
      );
    }

    const phoneRegex = /^\+?[\d\s\-\(\)]{8,20}$/;
    if (!phoneRegex.test(phone)) {
      return Response.json(
        {
          success: false,
          error: {
            code: "INVALID_PHONE",
            message: "Please enter a valid phone number",
            details: { phone: "Invalid phone number format" },
          },
        },
        { status: 400 },
      );
    }

    const normalizedEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;

    if (normalizedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return Response.json(
          {
            success: false,
            error: {
              code: "INVALID_EMAIL",
              message: "Please enter a valid email address",
              details: { email: "Invalid email format" },
            },
          },
          { status: 400 },
        );
      }
    }

    if (password.length < 6) {
      return Response.json(
        {
          success: false,
          error: {
            code: "WEAK_PASSWORD",
            message: "Password must be at least 6 characters long",
            details: { password: "Password too weak" },
          },
        },
        { status: 400 },
      );
    }

    const validLanguages = ["en", "fr", "so", "am", "om"];
    if (!validLanguages.includes(preferred_language)) {
      return Response.json(
        {
          success: false,
          error: {
            code: "INVALID_LANGUAGE",
            message: "Unsupported language",
            details: {
              preferred_language: "Must be one of: en, fr, so, am, om",
            },
          },
        },
        { status: 400 },
      );
    }

    const db = await getMongoDb();
    const users = db.collection("users");
    const authUsers = db.collection("auth_users");
    const authAccounts = db.collection("auth_accounts");
    const voiceProfiles = db.collection("voice_profiles");
    const auditLogs = db.collection("audit_logs");

    console.log('[REGISTER] Checking for duplicate users...');
    const duplicateUser = await users.findOne({
      $or: [{ phone }, { pension_number }],
    });
    if (duplicateUser) {
      console.warn('[REGISTER] Duplicate user found:', duplicateUser.id);
      const isDuplicatePhone = duplicateUser.phone === phone;
      const isDuplicatePension = duplicateUser.pension_number === pension_number;
      return Response.json(
        {
          success: false,
          error: {
            code: "USER_EXISTS",
            message: isDuplicatePhone
              ? "A user with this phone number already exists"
              : "A user with this pension number already exists",
            details: {
              phone: isDuplicatePhone ? "Phone number already registered" : null,
              pension_number: isDuplicatePension ? "Pension number already registered" : null,
            },
          },
        },
        { status: 409 },
      );
    }

    if (normalizedEmail) {
      const existingEmail = await authUsers.findOne({ email: normalizedEmail });
      if (existingEmail) {
        console.warn('[REGISTER] Email already exists');
        return Response.json(
          {
            success: false,
            error: {
              code: "EMAIL_EXISTS",
              message: "A user with this email already exists",
              details: { email: "Email already registered" },
            },
          },
          { status: 409 },
        );
      }
    }

    const nowIso = new Date().toISOString();
    const userId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    const authUserId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());

    // Create auth user FIRST so we have the auth_user_id ready
    const authUserDoc = {
      id: authUserId,
      email: normalizedEmail || null,
      emailVerified: null,
      name,
      image: null,
      created_at: nowIso,
      updated_at: nowIso,
    };
    await authUsers.insertOne(authUserDoc);

    const hashedPassword = await hash(password);
    const authAccountDoc = {
      userId: authUserId,
      provider: 'credentials',
      type: 'credentials',
      providerAccountId: authUserId,
      access_token: null,
      expires_at: null,
      refresh_token: null,
      id_token: null,
      scope: null,
      session_state: null,
      token_type: null,
      password: hashedPassword,
      created_at: nowIso,
      updated_at: nowIso,
    };
    await authAccounts.insertOne(authAccountDoc);

    // Now insert user with auth_user_id already set (atomic, no race condition)
    const userDoc = {
      id: userId,
      name,
      phone: phone.trim(),
      email: normalizedEmail || null,
      date_of_birth: date_of_birth || null,
      pension_number,
      preferred_language,
      auth_user_id: authUserId,
      role: 'user',
      profile_completed: false,
      voice_verified: false,
      face_verified: false,
      document_verified: false,
      admin_approved: false,
      payment_released: false,
      created_at: nowIso,
      updated_at: nowIso,
    };
    await users.insertOne(userDoc);
    console.log('[REGISTER] User created:', userDoc.id);

    const voiceProfileDoc = {
      id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
      user_id: userDoc.id,
      voice_model_ref: null,
      enrollment_samples_count: 0,
      is_enrolled: false,
      last_match_score: null,
      created_at: nowIso,
      updated_at: nowIso,
    };
    await voiceProfiles.insertOne(voiceProfileDoc);

    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    await auditLogs.insertOne({
      user_id: userDoc.id,
      action: 'USER_REGISTERED',
      details: { phone, email, pension_number, preferred_language },
      ip_address: ipAddress,
      created_at: new Date().toISOString(),
    });

    console.log('[REGISTER] Registration completed successfully');
    return Response.json(
      {
        success: true,
        data: {
          user: {
            id: userDoc.id,
            name: userDoc.name,
            phone: userDoc.phone,
            email: userDoc.email,
            pension_number: userDoc.pension_number,
            preferred_language: userDoc.preferred_language,
            created_at: userDoc.created_at,
          },
          auth_user_id: authUserId,
          next_step: "voice_enrollment",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    // Special-case: backend not configured with MongoDB
    if (error && String(error.message || '').includes('MONGODB_URI environment variable is not set')) {
      console.error('[REGISTER] Missing MONGODB_URI configuration');
      return Response.json({
        success: false,
        error: {
          code: 'MISCONFIGURED_DATABASE',
          message: 'Server database is not configured. Please set MONGODB_URI in apps/web/.env and restart the server.',
          details: process.env.NODE_ENV === 'development' ? 'Missing MONGODB_URI' : null,
        },
      }, { status: 500 });
    }
    // Handle unique index violations gracefully
    if (error && (error.code === 11000 || String(error.message || '').includes('E11000'))) {
      const msg = String(error.message || '');
      // Determine which unique key was violated based on index names
      if (msg.includes('uniq_phone') || msg.includes('index: phone_1') || msg.includes('phone dup key')) {
        return Response.json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'A user with this phone number already exists',
            details: { phone: 'Phone number already registered' }
          }
        }, { status: 409 });
      }
      if (msg.includes('uniq_pension') || msg.includes('index: pension_number_1') || msg.includes('pension_number dup key')) {
        return Response.json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'A user with this pension number already exists',
            details: { pension_number: 'Pension number already registered' }
          }
        }, { status: 409 });
      }
      if (msg.includes('uniq_email_non_null') || msg.includes('index: email_1') || msg.includes('email dup key')) {
        return Response.json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'A user with this email already exists',
            details: { email: 'Email already registered' }
          }
        }, { status: 409 });
      }
    }

    console.error("Registration error:", error);
    return Response.json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal error occurred during registration",
        details: process.env.NODE_ENV === "development" ? error.message : null,
      },
    }, { status: 500 });
  }
}
