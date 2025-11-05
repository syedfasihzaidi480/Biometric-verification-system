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

    // Get facial/liveness data from verification requests
    const facialVerification = verificationReqs.find(req => req.liveness_image_url);

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
      preferred_language: user.preferred_language,
      pension_number: user.pension_number,
      admin_approved: user.admin_approved || false,
      voice_verified: user.voice_verified || false,
      face_verified: user.face_verified || false,
      document_verified: user.document_verified || false,
      profile_completed: user.profile_completed || false,
      created_at: user.created_at,
      updated_at: user.updated_at,
      voice_profile: voiceProfile
        ? {
            id: voiceProfile.id,
            is_verified: voiceProfile.is_verified,
            is_enrolled: voiceProfile.is_enrolled,
            confidence_score: voiceProfile.confidence_score,
            last_match_score: voiceProfile.last_match_score,
            enrollment_samples_count: voiceProfile.enrollment_samples_count,
            audio_url: voiceProfile.audio_url || voiceProfile.voice_sample_url,
            voice_model_ref: voiceProfile.voice_model_ref,
            created_at: voiceProfile.created_at,
            updated_at: voiceProfile.updated_at,
          }
        : null,
      facial_verification: facialVerification
        ? {
            liveness_image_url: facialVerification.liveness_image_url,
            status: facialVerification.status,
            created_at: facialVerification.created_at,
          }
        : null,
      documents: userDocuments.map((doc) => ({
        id: doc.id,
        document_type: doc.document_type,
        document_url: doc.document_image_url || doc.document_url,
        is_verified: doc.is_verified,
        verification_notes: doc.verification_notes,
        created_at: doc.created_at,
      })),
      verification_requests: verificationReqs.map((req) => ({
        id: req.id,
        status: req.status,
        voice_match_score: req.voice_match_score,
        liveness_image_url: req.liveness_image_url,
        document_url: req.document_url,
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
