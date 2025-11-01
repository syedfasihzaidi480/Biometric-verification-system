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

    // Get voice profile
    const voiceProfile = await voiceProfiles.findOne({ user_id: user.id });

    // Get documents
    const userDocuments = await documents
      .find({ user_id: user.id })
      .sort({ created_at: -1 })
      .toArray();

    // Get verification requests
    const verificationReqs = await verificationRequests
      .find({ user_id: user.id })
      .sort({ created_at: -1 })
      .toArray();

    // Build detailed user object
    const userDetails = {
      id: user.id,
      auth_user_id: user.auth_user_id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      date_of_birth: user.date_of_birth,
      address: user.address,
      city: user.city,
      country: user.country,
      admin_approved: user.admin_approved || false,
      voice_verified: voiceProfile?.is_verified || false,
      document_verified: userDocuments.some((doc) => doc.is_verified),
      created_at: user.created_at,
      updated_at: user.updated_at,
      voice_profile: voiceProfile
        ? {
            id: voiceProfile.id,
            is_verified: voiceProfile.is_verified,
            confidence_score: voiceProfile.confidence_score,
            audio_url: voiceProfile.audio_url,
            created_at: voiceProfile.created_at,
          }
        : null,
      documents: userDocuments.map((doc) => ({
        id: doc.id,
        document_type: doc.document_type,
        document_url: doc.document_url,
        is_verified: doc.is_verified,
        verification_notes: doc.verification_notes,
        created_at: doc.created_at,
      })),
      verification_requests: verificationReqs.map((req) => ({
        id: req.id,
        status: req.status,
        admin_id: req.admin_id,
        admin_notes: req.admin_notes,
        created_at: req.created_at,
        updated_at: req.updated_at,
      })),
    };

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
