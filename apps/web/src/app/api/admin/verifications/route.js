import sql from '@/app/api/utils/sql';

/**
 * Admin verification management endpoints
 * GET /api/admin/verifications - List verification requests
 * POST /api/admin/verifications - Filter verification requests
 */

export async function GET(request) {
  try {
    // TODO: Add admin authentication middleware
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const offset = (page - 1) * limit;

    // Build query conditions
    let whereConditions = [];
    let params = [];

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      whereConditions.push(`vr.status = $${params.length + 1}`);
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Validate sort parameters
    const validSortFields = ['created_at', 'updated_at', 'voice_match_score', 'status'];
    const validSortOrders = ['asc', 'desc'];
    const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Get verification requests with user information
    const verificationQuery = `
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
        u.preferred_language,
        admin.name as admin_name,
        vp.is_enrolled as voice_enrolled,
        vp.enrollment_samples_count
      FROM verification_requests vr
      JOIN users u ON vr.user_id = u.id
      LEFT JOIN users admin ON vr.admin_id = admin.id
      LEFT JOIN voice_profiles vp ON u.id = vp.user_id
      ${whereClause}
      ORDER BY vr.${finalSortBy} ${finalSortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(limit, offset);
    const verifications = await sql(verificationQuery, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM verification_requests vr
      JOIN users u ON vr.user_id = u.id
      ${whereClause}
    `;
    
    const countParams = params.slice(0, -2); // Remove limit and offset
    const totalResult = await sql(countQuery, countParams);
    const total = parseInt(totalResult[0].total);

    // Get status summary
    const statusSummary = await sql`
      SELECT 
        status, 
        COUNT(*) as count
      FROM verification_requests 
      GROUP BY status
    `;

    return Response.json({
      success: true,
      data: {
        verifications: verifications.map(v => ({
          id: v.id,
          user: {
            id: v.user_id,
            name: v.user_name,
            phone: v.user_phone,
            email: v.user_email,
            preferred_language: v.preferred_language,
            voice_enrolled: v.voice_enrolled,
            enrollment_samples_count: v.enrollment_samples_count
          },
          voice_match_score: v.voice_match_score,
          liveness_image_url: v.liveness_image_url,
          document_url: v.document_url,
          status: v.status,
          admin: v.admin_id ? {
            id: v.admin_id,
            name: v.admin_name
          } : null,
          notes: v.notes,
          created_at: v.created_at,
          updated_at: v.updated_at
        })),
        pagination: {
          page: page,
          limit: limit,
          total: total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        summary: {
          total: total,
          by_status: statusSummary.reduce((acc, item) => {
            acc[item.status] = parseInt(item.count);
            return acc;
          }, {})
        }
      }
    });

  } catch (error) {
    console.error('Admin verifications list error:', error);
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred while fetching verifications',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    }, { status: 500 });
  }
}

/**
 * Search and filter verification requests
 */
export async function POST(request) {
  try {
    // TODO: Add admin authentication middleware
    const body = await request.json();
    const { 
      search, 
      status, 
      dateFrom, 
      dateTo, 
      voiceScoreMin, 
      voiceScoreMax,
      page = 1, 
      limit = 20 
    } = body;

    const offset = (page - 1) * limit;

    // Build dynamic query
    let whereConditions = [];
    let params = [];

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      whereConditions.push(`vr.status = $${params.length + 1}`);
      params.push(status);
    }

    if (search) {
      whereConditions.push(`(
        LOWER(u.name) LIKE LOWER($${params.length + 1}) OR
        u.phone LIKE $${params.length + 1} OR
        LOWER(u.email) LIKE LOWER($${params.length + 1})
      )`);
      params.push(`%${search}%`);
    }

    if (dateFrom) {
      whereConditions.push(`vr.created_at >= $${params.length + 1}`);
      params.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push(`vr.created_at <= $${params.length + 1}`);
      params.push(dateTo);
    }

    if (voiceScoreMin !== undefined) {
      whereConditions.push(`vr.voice_match_score >= $${params.length + 1}`);
      params.push(voiceScoreMin);
    }

    if (voiceScoreMax !== undefined) {
      whereConditions.push(`vr.voice_match_score <= $${params.length + 1}`);
      params.push(voiceScoreMax);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Get filtered verification requests
    const verificationQuery = `
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
        u.preferred_language,
        admin.name as admin_name,
        vp.is_enrolled as voice_enrolled
      FROM verification_requests vr
      JOIN users u ON vr.user_id = u.id
      LEFT JOIN users admin ON vr.admin_id = admin.id
      LEFT JOIN voice_profiles vp ON u.id = vp.user_id
      ${whereClause}
      ORDER BY vr.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    params.push(limit, offset);
    const verifications = await sql(verificationQuery, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM verification_requests vr
      JOIN users u ON vr.user_id = u.id
      ${whereClause}
    `;
    
    const countParams = params.slice(0, -2); // Remove limit and offset
    const totalResult = await sql(countQuery, countParams);
    const total = parseInt(totalResult[0].total);

    return Response.json({
      success: true,
      data: {
        verifications: verifications.map(v => ({
          id: v.id,
          user: {
            id: v.user_id,
            name: v.user_name,
            phone: v.user_phone,
            email: v.user_email,
            preferred_language: v.preferred_language,
            voice_enrolled: v.voice_enrolled
          },
          voice_match_score: v.voice_match_score,
          liveness_image_url: v.liveness_image_url,
          document_url: v.document_url,
          status: v.status,
          admin: v.admin_id ? {
            id: v.admin_id,
            name: v.admin_name
          } : null,
          notes: v.notes,
          created_at: v.created_at,
          updated_at: v.updated_at
        })),
        pagination: {
          page: page,
          limit: limit,
          total: total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        filters: {
          search,
          status,
          dateFrom,
          dateTo,
          voiceScoreMin,
          voiceScoreMax
        }
      }
    });

  } catch (error) {
    console.error('Admin verifications search error:', error);
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred while searching verifications',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    }, { status: 500 });
  }
}