import { getMongoDb } from "@/app/api/utils/mongo";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id || !id.trim()) {
      return Response.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    const users = db.collection("users");
    const voiceProfiles = db.collection("voice_profiles");
    const documents = db.collection("documents");
    const verificationRequests = db.collection("verification_requests");

    // Get user
    const user = await users.findOne({ id: id.trim() });

    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get voice profile with enrollment details
    const voiceProfile = await voiceProfiles.findOne({ user_id: user.id });

    // Get all documents
    const userDocuments = await documents
      .find({ user_id: user.id })
      .sort({ uploaded_at: -1, created_at: -1 })
      .toArray();

    // Get all verification requests with details
    const verificationReqs = await verificationRequests
      .find({ user_id: user.id })
      .sort({ created_at: -1 })
      .toArray();

    // Get audit logs for this user
    const auditLogs = db.collection("audit_logs");
    const userLogs = await auditLogs
      .find({ user_id: user.id })
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();

    // Build comprehensive user details object
    const userDetails = {
      user: {
        id: user.id,
        auth_user_id: user.auth_user_id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        date_of_birth: user.date_of_birth,
        address: user.address,
        city: user.city,
        country: user.country,
        preferred_language: user.preferred_language,
        role: user.role,
        is_approved: user.is_approved,
        profile_completed: user.profile_completed,
        voice_verified: user.voice_verified || false,
        face_verified: user.face_verified || false,
        document_verified: user.document_verified || false,
        admin_approved: user.admin_approved || false,
        payment_released: user.payment_released || false,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      voice: voiceProfile
        ? {
            id: voiceProfile.id,
            user_id: voiceProfile.user_id,
            is_enrolled: voiceProfile.is_enrolled || false,
            is_verified: voiceProfile.is_verified || false,
            enrollment_samples_count: voiceProfile.enrollment_samples_count || 0,
            confidence_score: voiceProfile.confidence_score,
            last_match_score: voiceProfile.last_match_score,
            last_verification_date: voiceProfile.last_verification_date,
            total_verifications: voiceProfile.total_verifications || 0,
            audio_url: voiceProfile.audio_url,
            created_at: voiceProfile.created_at,
            updated_at: voiceProfile.updated_at,
          }
        : null,
      documents: userDocuments.map((doc) => ({
        id: doc.id,
        user_id: doc.user_id,
        type: doc.type || doc.document_type,
        url: doc.url || doc.document_url,
        extracted_text: doc.extracted_text,
        tamper_flag: doc.tamper_flag,
        is_verified: doc.is_verified || doc.verification_status === 'verified',
        verification_status: doc.verification_status,
        verification_notes: doc.verification_notes,
        uploaded_at: doc.uploaded_at,
        created_at: doc.created_at,
      })),
      verifications: verificationReqs.map((req) => ({
        id: req.id,
        user_id: req.user_id,
        voice_match_score: req.voice_match_score,
        liveness_image_url: req.liveness_image_url,
        document_url: req.document_url,
        status: req.status,
        admin_id: req.admin_id,
        notes: req.notes || req.admin_notes,
        created_at: req.created_at,
        updated_at: req.updated_at,
      })),
      audit_logs: userLogs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        timestamp: log.timestamp,
      })),
      statistics: {
        total_verifications: verificationReqs.length,
        pending_verifications: verificationReqs.filter((r) => r.status === "pending").length,
        approved_verifications: verificationReqs.filter((r) => r.status === "approved").length,
        rejected_verifications: verificationReqs.filter((r) => r.status === "rejected").length,
        total_documents: userDocuments.length,
        verified_documents: userDocuments.filter((d) => d.is_verified || d.verification_status === 'verified').length,
        total_audit_logs: userLogs.length,
      },
    };

    console.log(`[Admin User Details] Retrieved details for user: ${user.id}`);
    return Response.json({
      success: true,
      data: userDetails,
    });
  } catch (error) {
    console.error("[Admin User Details] Error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch user details",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/:id - Update user verification status
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id || !id.trim()) {
      return Response.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    const users = db.collection("users");

    // Get user
    const user = await users.findOne({ id: id.trim() });

    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Build update object
    const update = {
      updated_at: new Date().toISOString(),
    };

    // Update fields if provided
    if (body.admin_approved !== undefined) {
      update.admin_approved = Boolean(body.admin_approved);
    }
    if (body.payment_released !== undefined) {
      update.payment_released = Boolean(body.payment_released);
    }
    if (body.voice_verified !== undefined) {
      update.voice_verified = Boolean(body.voice_verified);
    }
    if (body.face_verified !== undefined) {
      update.face_verified = Boolean(body.face_verified);
    }
    if (body.document_verified !== undefined) {
      update.document_verified = Boolean(body.document_verified);
    }

    // Update user
    await users.updateOne({ id: id.trim() }, { $set: update });

    // Get updated user
    const updatedUser = await users.findOne({ id: id.trim() });

    // Log action
    const auditLogs = db.collection("audit_logs");
    await auditLogs.insertOne({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: id.trim(),
      admin_id: body.admin_id || null,
      action: "user_status_updated",
      details: JSON.stringify(update),
      timestamp: new Date().toISOString(),
    });

    console.log(`[Admin User Update] Updated user ${id} status:`, update);

    return Response.json({
      success: true,
      message: "User status updated successfully",
      data: {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          admin_approved: updatedUser.admin_approved,
          payment_released: updatedUser.payment_released,
          voice_verified: updatedUser.voice_verified,
          face_verified: updatedUser.face_verified,
          document_verified: updatedUser.document_verified,
          updated_at: updatedUser.updated_at,
        },
      },
    });
  } catch (error) {
    console.error("[Admin User Update] Error:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to update user",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
