import { auth } from "@/auth";
import { getMongoDb } from "@/app/api/utils/mongo";

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    const { id } = params;
    const body = await request.json();
    const { action } = body; // 'approve' or 'reject'

    if (!session || !session.user?.id) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return Response.json(
        { success: false, error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    const users = db.collection("users");
    const authUsers = db.collection("auth_users");
    const authAccounts = db.collection("auth_accounts");

    // Check if user is super admin
    const currentUser = await users.findOne({ auth_user_id: session.user.id });
    if (!currentUser || currentUser.role !== "super_admin") {
      return Response.json(
        { success: false, error: "Super admin privileges required" },
        { status: 403 }
      );
    }

    // Get the admin to approve/reject
    const adminToUpdate = await users.findOne({ id });
    if (!adminToUpdate) {
      return Response.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    if (adminToUpdate.role !== "admin") {
      return Response.json(
        { success: false, error: "User is not an admin" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (action === "approve") {
      // Approve the admin
      await users.updateOne(
        { id },
        {
          $set: {
            is_approved: true,
            updated_at: now,
          },
        }
      );

      return Response.json({
        success: true,
        message: `Admin ${adminToUpdate.name} has been approved`,
        data: {
          id: adminToUpdate.id,
          name: adminToUpdate.name,
          email: adminToUpdate.email,
          is_approved: true,
        },
      });
    } else {
      // Reject - delete the admin account
      await users.deleteOne({ id });
      
      // Also delete auth records
      const authUserId = adminToUpdate.auth_user_id;
      await authUsers.deleteOne({ id: authUserId });
      await authAccounts.deleteMany({ userId: authUserId });

      return Response.json({
        success: true,
        message: `Admin request for ${adminToUpdate.name} has been rejected and removed`,
        data: {
          id: adminToUpdate.id,
          name: adminToUpdate.name,
          email: adminToUpdate.email,
        },
      });
    }
  } catch (error) {
    console.error("[Admin Approval Action] Error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to process admin approval",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
