import { getMongoDb } from "@/app/api/utils/mongo";
import { hash } from "argon2";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    // Validation
    if (!name || !email || !password) {
      return Response.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    const authUsers = db.collection("auth_users");
    const authAccounts = db.collection("auth_accounts");
    const users = db.collection("users");

    // Check if admin already exists
    const existingAuthUser = await authUsers.findOne({ email });
    if (existingAuthUser) {
      return Response.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const authUserId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    const userId = globalThis.crypto?.randomUUID?.() ?? String(Date.now() + 1);

    // Hash password
    const hashedPassword = await hash(password);

    // Create auth_user
    const authUserDoc = {
      id: authUserId,
      name,
      email,
      emailVerified: null,
      image: null,
    };
    await authUsers.insertOne(authUserDoc);

    // Create auth_account with credentials
    const authAccountDoc = {
      id: globalThis.crypto?.randomUUID?.() ?? String(Date.now() + 2),
      userId: authUserId,
      provider: "credentials",
      type: "credentials",
      providerAccountId: authUserId,
      password: hashedPassword,
      access_token: null,
      expires_at: null,
      refresh_token: null,
      id_token: null,
      scope: null,
      session_state: null,
      token_type: null,
    };
    await authAccounts.insertOne(authAccountDoc);

    // Create user profile with admin role (pending approval)
    const userDoc = {
      id: userId,
      auth_user_id: authUserId,
      name,
      email,
      phone: null,
      date_of_birth: null,
      preferred_language: "en",
      role: "admin",
      is_approved: false, // Needs super admin approval
      profile_completed: true,
      voice_verified: false,
      face_verified: false,
      document_verified: false,
      admin_approved: false,
      payment_released: false,
      created_at: now,
      updated_at: now,
    };
    await users.insertOne(userDoc);

    return Response.json({
      success: true,
      message: "Admin account created successfully. Pending approval from super admin.",
      data: {
        userId,
        authUserId,
        email,
        name,
        note: "Your account is pending approval. You will be notified once approved.",
      },
    });
  } catch (error) {
    console.error("[Admin Signup] Error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to create admin account",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
