import { getMongoDb } from "@/app/api/utils/mongo";
import { verify } from "argon2";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, requiredRole } = body;

    // Validation
    if (!email || !password) {
      return Response.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate required role
    if (requiredRole && requiredRole !== "admin" && requiredRole !== "super_admin") {
      return Response.json(
        { success: false, error: "Invalid role specified" },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    const authUsers = db.collection("auth_users");
    const authAccounts = db.collection("auth_accounts");
    const users = db.collection("users");
    const authSessions = db.collection("auth_sessions");

    // Get auth user
    const authUser = await authUsers.findOne({ email });
    if (!authUser) {
      return Response.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Get credentials account
    const account = await authAccounts.findOne({
      userId: authUser.id,
      provider: "credentials",
    });

    if (!account || !account.password) {
      return Response.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verify(account.password, password);
    if (!isValid) {
      return Response.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const user = await users.findOne({ auth_user_id: authUser.id });
    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return Response.json(
        { success: false, error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    // Check if admin is approved (super_admin is always approved)
    if (user.role === "admin" && !user.is_approved) {
      return Response.json(
        { success: false, error: "Your admin account is pending approval. Please contact the super administrator." },
        { status: 403 }
      );
    }

    // Verify the required role matches the user's actual role
    if (requiredRole && user.role !== requiredRole) {
      if (requiredRole === "super_admin" && user.role === "admin") {
        return Response.json(
          { success: false, error: "You don't have Super Admin privileges. Please select Admin instead." },
          { status: 403 }
        );
      } else if (requiredRole === "admin" && user.role === "super_admin") {
        return Response.json(
          { success: false, error: "You are a Super Admin. Please select Super Admin from the dropdown." },
          { status: 403 }
        );
      } else {
        return Response.json(
          { success: false, error: "Access denied. Invalid role selection." },
          { status: 403 }
        );
      }
    }

    // Return success - Auth.js will handle session creation
    return Response.json({
      success: true,
      message: "Admin credentials verified successfully",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("[Admin Signin] Error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to sign in",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
