import { auth } from "@/auth";
import { getMongoDb } from "@/app/api/utils/mongo";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return Response.json({
        success: false,
        isAuthenticated: false,
        isAdmin: false,
      });
    }

    const db = await getMongoDb();
    const users = db.collection("users");

    const user = await users.findOne({ auth_user_id: session.user.id });

    if (!user) {
      return Response.json({
        success: false,
        isAuthenticated: true,
        isAdmin: false,
        message: "User profile not found",
      });
    }

    const isAdmin = (user.role === "admin" || user.role === "super_admin") && user.is_approved !== false;
    const isSuperAdmin = user.role === "super_admin";

    return Response.json({
      success: true,
      isAuthenticated: true,
      isAdmin,
      isSuperAdmin,
      data: {
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
      },
      { status: 500 }
    );
  }
}
