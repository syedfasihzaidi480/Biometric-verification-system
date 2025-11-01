import { auth } from "@/auth";
import { getMongoDb } from "@/app/api/utils/mongo";

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await getMongoDb();
    const users = db.collection("users");

    // Check if user is super admin
    const currentUser = await users.findOne({ auth_user_id: session.user.id });
    if (!currentUser || currentUser.role !== "super_admin") {
      return Response.json(
        { success: false, error: "Super admin privileges required" },
        { status: 403 }
      );
    }

    // Get all pending admin requests
    const pendingAdmins = await users
      .find({
        role: "admin",
        is_approved: false,
      })
      .sort({ created_at: -1 })
      .toArray();

    // Get all approved admins
    const approvedAdmins = await users
      .find({
        role: "admin",
        is_approved: true,
      })
      .sort({ created_at: -1 })
      .toArray();

    return Response.json({
      success: true,
      data: {
        pending: pendingAdmins.map((admin) => ({
          id: admin.id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          created_at: admin.created_at,
          is_approved: admin.is_approved,
        })),
        approved: approvedAdmins.map((admin) => ({
          id: admin.id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
          created_at: admin.created_at,
          is_approved: admin.is_approved,
        })),
      },
    });
  } catch (error) {
    console.error("[Admin Approvals] Error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch admin approvals",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
