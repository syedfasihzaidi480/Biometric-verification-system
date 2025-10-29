import sql from '@/app/api/utils/sql';

/**
 * Individual verification request management
 * GET /api/admin/verifications/[id] - Get verification details
 * PATCH /api/admin/verifications/[id] - Update verification status
 */

export async function GET(request, { params }) {
  try {
    // TODO: Add admin authentication middleware
    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return Response.json({
        success: false,
        error: {
          code: 'INVALID_VERIFICATION_ID',
          message: 'Valid verification ID is required'
        }
      }, { status: 400 });
    }

    // Get detailed verification information
    const verification = await sql`
      SELECT 
        vr.id,
        vr.user_id,
        vr.voice_match_score,
        vr.liveness_image_url,
        vr.document_url,
        vr.status,
        vr.admin_id,
        vr.notes,
        vr.created_at,
        vr.updated_at,
        u.name as user_name,
        u.phone as user_phone,
        u.email as user_email,
        u.date_of_birth,
        u.preferred_language,
        u.created_at as user_created_at,
        admin.name as admin_name,
        vp.voice_model_ref,
        vp.is_enrolled as voice_enrolled,
        vp.enrollment_samples_count,
        vp.last_match_score,
        d.id as document_id,
        d.document_type,
        d.document_text,
        d.tamper_flag
      FROM verification_requests vr
      JOIN users u ON vr.user_id = u.id
      LEFT JOIN users admin ON vr.admin_id = admin.id
      LEFT JOIN voice_profiles vp ON u.id = vp.user_id
      LEFT JOIN documents d ON u.id = d.user_id 
        AND d.document_image_url = vr.document_url
      WHERE vr.id = ${id}
    `;

    if (verification.length === 0) {
      return Response.json({
        success: false,
        error: {
          code: 'VERIFICATION_NOT_FOUND',
          message: 'Verification request not found'
        }
      }, { status: 404 });
    }

    const v = verification[0];

    // Get audit trail for this verification
    const auditLogs = await sql`
      SELECT 
        action,
        details,
        ip_address,
        created_at
      FROM audit_logs
      WHERE user_id = ${v.user_id}
      AND (
        action IN ('VOICE_ENROLLED', 'VOICE_VERIFICATION_ATTEMPT', 'LIVENESS_CHECK', 'DOCUMENT_UPLOADED')
        OR details::jsonb ? 'verificationRequestId'
      )
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return Response.json({
      success: true,
      data: {
        verification: {
          id: v.id,
          user: {
            id: v.user_id,
            name: v.user_name,
            phone: v.user_phone,
            email: v.user_email,
            date_of_birth: v.date_of_birth,
            preferred_language: v.preferred_language,
            created_at: v.user_created_at
          },
          voice: {
            match_score: v.voice_match_score,
            model_ref: v.voice_model_ref,
            is_enrolled: v.voice_enrolled,
            enrollment_samples_count: v.enrollment_samples_count,
            last_match_score: v.last_match_score
          },
          liveness: {
            image_url: v.liveness_image_url
          },
          document: v.document_id ? {
            id: v.document_id,
            type: v.document_type,
            url: v.document_url,
            extracted_text: v.document_text,
            tamper_flag: v.tamper_flag
          } : null,
          status: v.status,
          admin: v.admin_id ? {
            id: v.admin_id,
            name: v.admin_name
          } : null,
          notes: v.notes,
          created_at: v.created_at,
          updated_at: v.updated_at
        },
        audit_trail: auditLogs.map(log => ({
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

    if (!id || isNaN(parseInt(id))) {
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

    // Verify admin exists
    const admin = await sql`
      SELECT id, name, role FROM users 
      WHERE id = ${adminId} AND role = 'admin'
    `;

    if (admin.length === 0) {
      return Response.json({
        success: false,
        error: {
          code: 'INVALID_ADMIN',
          message: 'Invalid admin user'
        }
      }, { status: 403 });
    }

    // Get current verification
    const currentVerification = await sql`
      SELECT id, user_id, status FROM verification_requests 
      WHERE id = ${id}
    `;

    if (currentVerification.length === 0) {
      return Response.json({
        success: false,
        error: {
          code: 'VERIFICATION_NOT_FOUND',
          message: 'Verification request not found'
        }
      }, { status: 404 });
    }

    const verification = currentVerification[0];

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
    const updatedVerification = await sql`
      UPDATE verification_requests 
      SET 
        status = ${newStatus},
        admin_id = ${adminId},
        notes = ${notes || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    // Log admin action
    await sql`
      INSERT INTO audit_logs (user_id, action, details, ip_address)
      VALUES (
        ${verification.user_id}, 
        ${action === 'approve' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED'},
        ${JSON.stringify({ 
          verificationId: id,
          adminId: adminId,
          adminName: admin[0].name,
          notes: notes || null,
          previousStatus: verification.status
        })},
        ${request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'}
      )
    `;

    // TODO: Trigger payment release for approved verifications
    // TODO: Send notification to user

    return Response.json({
      success: true,
      data: {
        verification: {
          id: updatedVerification[0].id,
          status: updatedVerification[0].status,
          admin_id: updatedVerification[0].admin_id,
          notes: updatedVerification[0].notes,
          updated_at: updatedVerification[0].updated_at
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