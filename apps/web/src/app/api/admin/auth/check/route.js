import { auth } from "@/auth";
import { getMongoDb } from "@/app/api/utils/mongo";

export async function GET() {
  try {
    console.log("[Admin Auth Check] Starting auth check...");
    const session = await auth();
    console.log("[Admin Auth Check] Session:", JSON.stringify(session, null, 2));

    if (!session || !session.user?.id) {
      console.log("[Admin Auth Check] No session or user ID found");
      return Response.json({
        success: false,
        isAuthenticated: false,
        isAdmin: false,
      });
    }

    console.log("[Admin Auth Check] User ID from session:", session.user.id);

    const db = await getMongoDb();
    const users = db.collection("users");

    const user = await users.findOne({ auth_user_id: session.user.id });
    console.log("[Admin Auth Check] User from DB:", user ? { id: user.id, role: user.role, email: user.email } : null);

    if (!user) {
      console.log("[Admin Auth Check] User profile not found in DB");
      return Response.json({
        success: false,
        isAuthenticated: true,
        isAdmin: false,
        message: "User profile not found",
      });
    }

    const isAdmin = (user.role === "admin" || user.role === "super_admin") && user.is_approved !== false;
    const isSuperAdmin = user.role === "super_admin";

    console.log("[Admin Auth Check] isAdmin:", isAdmin, "isSuperAdmin:", isSuperAdmin);

    return Response.json({
      success: true,
      isAuthenticated: true,
      isAdmin,
      isSuperAdmin,
      data: {
        isAdmin,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_approved: user.is_approved !== false,
        },
      },
    });
  } catch (error) {
    console.error("[Admin Auth Check] Error:", error);
    return Response.json(
      {
        success: false,
        isAuthenticated: false,
        isAdmin: false,
        error: "Failed to check authentication",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
