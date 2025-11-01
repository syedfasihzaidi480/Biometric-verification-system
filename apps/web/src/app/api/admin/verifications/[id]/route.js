import { getMongoDb } from '@/app/api/utils/mongo';

/**
 * Individual verification request management
 * GET /api/admin/verifications/[id] - Get verification details
 * PATCH /api/admin/verifications/[id] - Update verification status
 */

export async function GET(request, { params }) {
  try {
    // TODO: Add admin authentication middleware
    const { id } = params;

    if (!id || !id.trim()) {
      return Response.json({
        success: false,
        error: {
          code: 'INVALID_VERIFICATION_ID',
          message: 'Valid verification ID is required'
        }
      }, { status: 400 });
    }

    const db = await getMongoDb();
    const verificationRequests = db.collection('verification_requests');
    const users = db.collection('users');
    const voiceProfiles = db.collection('voice_profiles');
    const documents = db.collection('documents');
    const auditLogs = db.collection('audit_logs');

    // Get verification request
    const verification = await verificationRequests.findOne({ id: id });

    if (!verification) {
      return Response.json({
        success: false,
        error: {
          code: 'VERIFICATION_NOT_FOUND',
          message: 'Verification request not found'
        }
      }, { status: 404 });
    }

    // Get user details
    const user = await users.findOne({ id: verification.user_id });
    
    // Get admin details if assigned
    let admin = null;
    if (verification.admin_id) {
      admin = await users.findOne({ id: verification.admin_id });
    }

    // Get voice profile
    const voiceProfile = await voiceProfiles.findOne({ user_id: verification.user_id });

    // Get document
    const document = await documents.findOne({ 
      user_id: verification.user_id,
      document_image_url: verification.document_url
    });

    // Get audit trail for this verification
    const auditLogsData = await auditLogs.find({
      user_id: verification.user_id,
      action: { 
        $in: [
          'VOICE_ENROLLED', 
          'VOICE_VERIFICATION_ATTEMPT', 
          'LIVENESS_CHECK', 
          'DOCUMENT_UPLOADED',
          'VERIFICATION_APPROVED',
          'VERIFICATION_REJECTED'
        ]
      }
    })
    .sort({ created_at: -1 })
    .limit(20)
    .toArray();

    return Response.json({
      success: true,
      data: {
        verification: {
          id: verification.id,
          user: user ? {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            date_of_birth: user.date_of_birth,
            preferred_language: user.preferred_language,
            created_at: user.created_at
          } : null,
          voice: voiceProfile ? {
            match_score: verification.voice_match_score,
            model_ref: voiceProfile.voice_model_ref,
            is_enrolled: voiceProfile.is_enrolled,
            enrollment_samples_count: voiceProfile.enrollment_samples_count,
            last_match_score: voiceProfile.last_match_score
          } : null,
          liveness: {
            image_url: verification.liveness_image_url
          },
          document: document ? {
            id: document.id,
            type: document.document_type,
            url: verification.document_url,
            extracted_text: document.document_text,
            tamper_flag: document.tamper_flag
          } : null,
          status: verification.status,
          admin: admin ? {
            id: admin.id,
            name: admin.name
          } : null,
          notes: verification.notes,
          created_at: verification.created_at,
          updated_at: verification.updated_at
        },
        audit_trail: auditLogsData.map(log => ({
          action: log.action,
          details: log.details,
          ip_address: log.ip_address,
          created_at: log.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Admin verification details error:', error);
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred while fetching verification details',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    }, { status: 500 });
  }
}

/**
 * Update verification status (approve/reject)
 */
export async function PATCH(request, { params }) {
  try {
    // TODO: Add admin authentication middleware
    const { id } = params;
    const body = await request.json();
    const { action, notes, adminId } = body;

    if (!id || !id.trim()) {
      return Response.json({
        success: false,
        error: {
          code: 'INVALID_VERIFICATION_ID',
          message: 'Valid verification ID is required'
        }
      }, { status: 400 });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return Response.json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: 'Action must be either "approve" or "reject"'
        }
      }, { status: 400 });
    }

    if (!adminId) {
      return Response.json({
        success: false,
        error: {
          code: 'MISSING_ADMIN_ID',
          message: 'Admin ID is required'
        }
      }, { status: 400 });
    }

    const db = await getMongoDb();
    const users = db.collection('users');
    const verificationRequests = db.collection('verification_requests');
    const auditLogs = db.collection('audit_logs');

    // Verify admin exists
    const admin = await users.findOne({ 
      id: adminId, 
      role: 'admin' 
    });

    if (!admin) {
      return Response.json({
        success: false,
        error: {
          code: 'INVALID_ADMIN',
          message: 'Invalid admin user'
        }
      }, { status: 403 });
    }

    // Get current verification
    const verification = await verificationRequests.findOne({ id: id });

    if (!verification) {
      return Response.json({
        success: false,
        error: {
          code: 'VERIFICATION_NOT_FOUND',
          message: 'Verification request not found'
        }
      }, { status: 404 });
    }

    if (verification.status !== 'pending') {
      return Response.json({
        success: false,
        error: {
          code: 'VERIFICATION_NOT_PENDING',
          message: 'Only pending verifications can be updated'
        }
      }, { status: 400 });
    }

    // Update verification status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const now = new Date().toISOString();
    
    await verificationRequests.updateOne(
      { id: id },
      {
        $set: {
          status: newStatus,
          admin_id: adminId,
          notes: notes || null,
          updated_at: now
        }
      }
    );

    // Get updated verification
    const updatedVerification = await verificationRequests.findOne({ id: id });

    // Log admin action
    await auditLogs.insertOne({
      user_id: verification.user_id,
      action: action === 'approve' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
      details: { 
        verificationId: id,
        adminId: adminId,
        adminName: admin.name,
        notes: notes || null,
        previousStatus: verification.status
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      created_at: now
    });

    // TODO: Trigger payment release for approved verifications
    // TODO: Send notification to user

    return Response.json({
      success: true,
      data: {
        verification: {
          id: updatedVerification.id,
          status: updatedVerification.status,
          admin_id: updatedVerification.admin_id,
          notes: updatedVerification.notes,
          updated_at: updatedVerification.updated_at
        },
        message: `Verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        next_steps: action === 'approve' ? ['payment_release', 'user_notification'] : ['user_notification']
      }
    });

  } catch (error) {
    console.error('Admin verification update error:', error);
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred while updating verification',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    }, { status: 500 });
  }
}