import { getMongoDb } from '@/app/api/utils/mongo';

/**
 * Admin users management endpoint
 * GET /api/admin/users - List all users with their verification status
 */

export async function GET(request) {
  try {
    // TODO: Add admin authentication middleware
    
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // verified, unverified, all

    const db = await getMongoDb();
    const users = db.collection('users');
  const verificationRequests = db.collection('verification_requests');
  const voiceProfiles = db.collection('voice_profiles');

    const offset = (page - 1) * limit;

  // Build base match criteria (search only). We'll apply status filter after computing latest_verification
  const baseMatch = {};
    
    // Search filter
    if (search) {
      baseMatch.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    // We'll filter by computed status (admin_approved OR latest_approved) after lookups

    // Get users with aggregation
    const pipeline = [
  { $match: baseMatch },
      { $sort: { created_at: -1 } },
      { $skip: offset },
      { $limit: limit },
      // Get latest verification via pipeline lookup (sorted by updated_at/created_at desc)
      {
        $lookup: {
          from: 'verification_requests',
          let: { uid: '$id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user_id', '$$uid'] } } },
            { $sort: { updated_at: -1, created_at: -1 } },
            { $limit: 1 },
          ],
          as: 'latest_verification'
        }
      },
      // Also fetch voice profile summary
      {
        $lookup: {
          from: 'voice_profiles',
          let: { uid: '$id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user_id', '$$uid'] } } },
            { $limit: 1 },
          ],
          as: 'voice_profile'
        }
      },
      {
        $addFields: {
          latest_verification: { $arrayElemAt: ['$latest_verification', 0] },
          voice_profile: { $arrayElemAt: ['$voice_profile', 0] },
          computed_verified: {
            $or: [
              { $eq: ['$admin_approved', true] },
              { $eq: ['$latest_verification.status', 'approved'] }
            ]
          }
        }
      },
      ...(status === 'verified' ? [{ $match: { computed_verified: true } }] : []),
      ...(status === 'unverified' ? [{ $match: { $or: [ { computed_verified: { $ne: true } }, { computed_verified: { $exists: false } } ] } }] : []),
    ];

    const usersList = await users.aggregate(pipeline).toArray();
    // For total counts respecting filters, re-run a lightweight count pipeline
    const countPipeline = [
      { $match: baseMatch },
      {
        $lookup: {
          from: 'verification_requests',
          let: { uid: '$id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user_id', '$$uid'] } } },
            { $sort: { updated_at: -1, created_at: -1 } },
            { $limit: 1 },
          ],
          as: 'latest_verification'
        }
      },
      { $addFields: { latest_verification: { $arrayElemAt: ['$latest_verification', 0] } } },
      { $addFields: { computed_verified: { $or: [ { $eq: ['$admin_approved', true] }, { $eq: ['$latest_verification.status', 'approved'] } ] } } },
      ...(status === 'verified' ? [{ $match: { computed_verified: true } }] : []),
      ...(status === 'unverified' ? [{ $match: { $or: [ { computed_verified: { $ne: true } }, { computed_verified: { $exists: false } } ] } }] : []),
      { $count: 'total' }
    ];
    const totalResult = await users.aggregate(countPipeline).toArray();
    const total = totalResult[0]?.total || 0;

    // Get summary statistics
    // Summary: compute verified as (admin_approved == true) OR (latest verification approved)
    const statsPipeline = [
      { $match: baseMatch },
      {
        $lookup: {
          from: 'verification_requests',
          let: { uid: '$id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$user_id', '$$uid'] } } },
            { $sort: { updated_at: -1, created_at: -1 } },
            { $limit: 1 },
          ],
          as: 'latest_verification'
        }
      },
      { $addFields: { latest_verification: { $arrayElemAt: ['$latest_verification', 0] } } },
      {
        $addFields: {
          computed_verified: {
            $or: [
              { $eq: ['$admin_approved', true] },
              { $eq: ['$latest_verification.status', 'approved'] }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          verified: { $sum: { $cond: ['$computed_verified', 1, 0] } },
          profile_completed: { $sum: { $cond: [{ $eq: ['$profile_completed', true] }, 1, 0] } },
          voice_verified: { $sum: { $cond: [{ $eq: ['$voice_verified', true] }, 1, 0] } },
          face_verified: { $sum: { $cond: [{ $eq: ['$face_verified', true] }, 1, 0] } },
          document_verified: { $sum: { $cond: [{ $eq: ['$document_verified', true] }, 1, 0] } },
        }
      }
    ];
    const stats = await users.aggregate(statsPipeline).toArray();

    const summary = stats[0] || {
      total: 0,
      verified: 0,
      profile_completed: 0,
      voice_verified: 0,
      face_verified: 0,
      document_verified: 0
    };

    // Build response list and best-effort self-heal for mismatches
    const nowIso = new Date().toISOString();
    const updates = [];
    const responseUsers = usersList.map((user) => {
      const computedApproved = user.admin_approved === true || user.latest_verification?.status === 'approved';
      // Self-heal: if computed is true but stored flag is false, set it true
      if (computedApproved && user.admin_approved !== true) {
        updates.push(
          users.updateOne({ id: user.id }, { $set: { admin_approved: true, updated_at: nowIso } })
        );
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        date_of_birth: user.date_of_birth,
        preferred_language: user.preferred_language,
        role: user.role,
        profile_completed: user.profile_completed,
        voice_verified: user.voice_verified,
        face_verified: user.face_verified,
        document_verified: user.document_verified,
        admin_approved: computedApproved,
        payment_released: user.payment_released,
        created_at: user.created_at,
        updated_at: user.updated_at,
        verification_status: user.latest_verification?.status || null,
        voice_enrolled: user.voice_profile?.is_enrolled || false,
        enrollment_samples_count: user.voice_profile?.enrollment_samples_count || 0,
      };
    });

    if (updates.length) {
      // Fire-and-forget; do not block response
      Promise.allSettled(updates).catch(() => {});
    }

    return Response.json({
      success: true,
      data: {
        users: responseUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        summary: {
          total: summary.total,
          verified: summary.verified,
          unverified: summary.total - summary.verified,
          profile_completed: summary.profile_completed,
          voice_verified: summary.voice_verified,
          face_verified: summary.face_verified,
          document_verified: summary.document_verified,
        }
      }
    });

  } catch (error) {
    console.error('Admin users list error:', error);
    
    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred while fetching users',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    }, { status: 500 });
  }
}
