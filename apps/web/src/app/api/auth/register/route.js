import sql from "@/app/api/utils/sql";
import { MongoClient } from "mongodb";
import { hash } from "argon2";

let mongoClient;
async function getMongoDb() {
  if (!process.env.MONGODB_URI) return null;
  if (!mongoClient) {
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    // Note: driver lazy connects on first call, but ensure in dev
  }
  return mongoClient.db(process.env.MONGODB_DB || "auth");
}

/**
 * User registration endpoint
 * POST /api/auth/register
 *
 * Required: name, phone, pension_number, email (for auth), password (for auth)
 * Optional: date_of_birth, preferred_language
 */
export async function POST(request) {
  try {
    console.log('[REGISTER] Registration request received');
    const body = await request.json();
    console.log('[REGISTER] Request body:', { ...body, password: body.password ? '***' : undefined });

    // Validate required fields - phone, pension_number, email, and password are required
    const {
      name,
      phone,
      email,
      password,
      date_of_birth,
      pension_number,
      preferred_language = "en",
    } = body;

    if (!name || !phone || !pension_number || !email || !password) {
      return Response.json(
        {
          success: false,
          error: {
            code: "MISSING_REQUIRED_FIELDS",
            message: "Name, phone number, pension number, email, and password are required",
            details: {
              name: !name ? "Name is required" : null,
              phone: !phone ? "Phone number is required" : null,
              pension_number: !pension_number
                ? "Pension number is required"
                : null,
              email: !email ? "Email is required for authentication" : null,
              password: !password ? "Password is required for authentication" : null,
            },
          },
        },
        { status: 400 },
      );
    }

    // Phone number validation (basic international format)
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

    // Email validation (if provided)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
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

    // Password validation
    if (password && password.length < 6) {
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

    // Validate preferred language
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
    if (db) {
      console.log('[REGISTER] Using MongoDB for registration');
      const users = db.collection("users");
      const authUsers = db.collection("auth_users");
      const authAccounts = db.collection("auth_accounts");
      const voiceProfiles = db.collection("voice_profiles");
      const auditLogs = db.collection("audit_logs");

      // Check duplicates by phone or pension_number
      console.log('[REGISTER] Checking for duplicate users...');
      const existingUser = await users.findOne({
        $or: [{ phone }, { pension_number }],
      });
      if (existingUser) {
        console.warn('[REGISTER] Duplicate user found:', existingUser.id);
        const isDuplicatePhone = existingUser.phone === phone;
        const isDuplicatePension = existingUser.pension_number === pension_number;
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

      // Email duplicate check if provided
      if (email) {
        console.log('[REGISTER] Checking email duplication...');
        const existingEmail = await authUsers.findOne({ email });
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

      console.log('[REGISTER] Creating user document...');
      const userId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
      const userDoc = {
        id: userId,
        name,
        phone,
        email: email || null,
        date_of_birth: date_of_birth || null,
        pension_number,
        preferred_language,
        created_at: new Date().toISOString(),
      };
      await users.insertOne(userDoc);
      console.log('[REGISTER] User created:', userDoc.id);

      // Create auth_users entry for authentication
      console.log('[REGISTER] Creating auth user...');
      const authUserId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
      const authUserDoc = {
        id: authUserId,
        email: email,
        emailVerified: null,
        name: name,
        image: null,
      };
      await authUsers.insertOne(authUserDoc);
      console.log('[REGISTER] Auth user created:', authUserId);

      // Create auth_accounts entry with hashed password
      console.log('[REGISTER] Creating auth account with credentials...');
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
      };
      await authAccounts.insertOne(authAccountDoc);
      console.log('[REGISTER] Auth account created');

      console.log('[REGISTER] Creating voice profile...');
      await voiceProfiles.insertOne({ user_id: userDoc.id });

      console.log('[REGISTER] Logging audit event...');
      await auditLogs.insertOne({
        user_id: userDoc.id,
        action: 'USER_REGISTERED',
        details: { phone, email, pension_number, preferred_language },
        ip_address:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
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
    }

    // Fallback: Postgres via Neon if configured
    console.log('[REGISTER] Using Postgres/Neon for registration');
    
    // Check if user already exists (by phone or pension number)
    const existingUser = await sql`
      SELECT id, phone, pension_number FROM users 
      WHERE phone = ${phone} OR pension_number = ${pension_number}
    `;

    if (existingUser.length > 0) {
      const existing = existingUser[0];
      const isDuplicatePhone = existing.phone === phone;
      const isDuplicatePension = existing.pension_number === pension_number;

      return Response.json(
        {
          success: false,
          error: {
            code: "USER_EXISTS",
            message: isDuplicatePhone
              ? "A user with this phone number already exists"
              : "A user with this pension number already exists",
            details: {
              phone: isDuplicatePhone
                ? "Phone number already registered"
                : null,
              pension_number: isDuplicatePension
                ? "Pension number already registered"
                : null,
            },
          },
        },
        { status: 409 },
      );
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await sql`
        SELECT id, email FROM auth_users WHERE email = ${email}
      `;

      if (existingEmail.length > 0) {
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

    // Create new user
    const newUser = await sql`
      INSERT INTO users (name, phone, email, date_of_birth, pension_number, preferred_language)
      VALUES (${name}, ${phone}, ${email || null}, ${date_of_birth || null}, ${pension_number}, ${preferred_language})
      RETURNING id, name, phone, email, pension_number, preferred_language, created_at
    `;

    const user = newUser[0];

    // Create auth_users entry
    console.log('[REGISTER] Creating auth user in Postgres...');
    const newAuthUser = await sql`
      INSERT INTO auth_users (name, email, "emailVerified", image)
      VALUES (${name}, ${email}, NULL, NULL)
      RETURNING id
    `;
    const authUserId = newAuthUser[0].id;
    console.log('[REGISTER] Auth user created:', authUserId);

    // Create auth_accounts entry with hashed password
    console.log('[REGISTER] Creating auth account with credentials...');
    const hashedPassword = await hash(password);
    await sql`
      INSERT INTO auth_accounts 
      ("userId", provider, type, "providerAccountId", access_token, expires_at, 
       refresh_token, id_token, scope, session_state, token_type, password)
      VALUES (
        ${authUserId}, 
        'credentials', 
        'credentials', 
        ${authUserId},
        NULL, NULL, NULL, NULL, NULL, NULL, NULL,
        ${hashedPassword}
      )
    `;
    console.log('[REGISTER] Auth account created');

    // Create voice profile for the user
    await sql`
      INSERT INTO voice_profiles (user_id)
      VALUES (${user.id})
    `;

    // Log registration event
    await sql`
      INSERT INTO audit_logs (user_id, action, details, ip_address)
      VALUES (
        ${user.id}, 
        'USER_REGISTERED',
        ${JSON.stringify({ phone, email, pension_number, preferred_language })},
        ${request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"}
      )
    `;

    console.log('[REGISTER] Registration completed successfully');
    return Response.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            pension_number: user.pension_number,
            preferred_language: user.preferred_language,
            created_at: user.created_at,
          },
          auth_user_id: authUserId,
          next_step: "voice_enrollment",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An internal error occurred during registration",
          details:
            process.env.NODE_ENV === "development" ? error.message : null,
        },
      },
      { status: 500 },
    );
  }
}
