import { getMongoDb } from '@/app/api/utils/mongo';
import { sendVerificationStatusNotification } from '@/app/api/utils/notifications';

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

    // Get ALL documents for the user
    const userDocuments = await documents.find({ 
      user_id: verification.user_id
    }).sort({ created_at: -1 }).toArray();

    // Get the specific document if verification has one
    const verificationDocument = verification.document_url 
      ? userDocuments.find(doc => doc.document_image_url === verification.document_url)
      : null;

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
            last_match_score: voiceProfile.last_match_score,
            audio_url: voiceProfile.audio_url,
            confidence_score: voiceProfile.confidence_score
          } : null,
          liveness: {
            image_url: verification.liveness_image_url
          },
          document: verificationDocument ? {
            id: verificationDocument.id,
            type: verificationDocument.document_type,
            url: verification.document_url,
            extracted_text: verificationDocument.document_text,
            tamper_flag: verificationDocument.tamper_flag
          } : null,
          documents: userDocuments.map(doc => ({
            id: doc.id,
            type: doc.document_type,
            url: doc.document_image_url,
            extracted_text: doc.document_text,
            tamper_flag: doc.tamper_flag,
            is_verified: doc.is_verified,
            verification_notes: doc.verification_notes,
            created_at: doc.created_at
          })),
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

    // Verify admin exists (check both id and auth_user_id)
    const admin = await users.findOne({ 
      $or: [{ id: adminId }, { auth_user_id: adminId }],
      role: { $in: ['admin', 'super_admin'] }
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

    // Reflect approval status on the user record so clients (mobile/web) see the change
    try {
      await users.updateOne(
        { id: verification.user_id },
        {
          $set: {
            admin_approved: action === 'approve',
            updated_at: now,
          }
        }
      );
    } catch (userUpdateError) {
      console.error('Failed to update user admin_approved status:', userUpdateError);
      // Continue; the verification status has been updated, but surface info in response below
    }

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

    // Also audit the user status change for traceability
    try {
      await auditLogs.insertOne({
        user_id: verification.user_id,
        action: 'USER_STATUS_UPDATED',
        details: {
          admin_approved: action === 'approve',
          source: 'ADMIN_VERIFICATION_PATCH',
          verificationId: id,
          adminId: adminId,
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        created_at: now,
      });
    } catch (auditUserError) {
      console.error('Failed to write user status audit log:', auditUserError);
      // Non-fatal
    }

    // Payment release (stub): mark user.payment_released=true when approved
    if (action === 'approve') {
      try {
        await users.updateOne(
          { id: verification.user_id },
          { $set: { payment_released: true, updated_at: now } }
        );
        await auditLogs.insertOne({
          user_id: verification.user_id,
          action: 'PAYMENT_RELEASED',
          details: { verificationId: id, adminId, reason: 'Auto-release on approval' },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          created_at: now,
        });
      } catch (paymentError) {
        console.error('Payment release failed (stub):', paymentError);
      }
    }

    // Notify user of decision
    try {
      await sendVerificationStatusNotification({
        userId: verification.user_id,
        approved: action === 'approve',
      });
    } catch (notifyErr) {
      console.error('Failed to send verification notification:', notifyErr);
    }

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
        user: {
          id: verification.user_id,
          admin_approved: action === 'approve'
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