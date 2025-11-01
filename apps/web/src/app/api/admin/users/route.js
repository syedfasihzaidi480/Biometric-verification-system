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

    // Build match criteria
    const match = {};
    
    // Search filter
    if (search) {
      match.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter
    if (status === 'verified') {
      match.admin_approved = true;
    } else if (status === 'unverified') {
      match.admin_approved = { $ne: true };
    }

    // Get users with aggregation
    const pipeline = [
      { $match: match },
      { $sort: { created_at: -1 } },
      { $skip: offset },
      { $limit: limit },
      {
        $lookup: {
          from: 'verification_requests',
          localField: 'id',
          foreignField: 'user_id',
          as: 'verification_requests'
        }
      },
      {
        $lookup: {
          from: 'voice_profiles',
          localField: 'id',
          foreignField: 'user_id',
          as: 'voice_profile'
        }
      },
      {
        $addFields: {
          latest_verification: { $arrayElemAt: ['$verification_requests', -1] },
          voice_profile: { $first: '$voice_profile' }
        }
      }
    ];

    const usersList = await users.aggregate(pipeline).toArray();
    const total = await users.countDocuments(match);

    // Get summary statistics
    const stats = await users.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$admin_approved', true] }, 1, 0] }
          },
          profile_completed: {
            $sum: { $cond: [{ $eq: ['$profile_completed', true] }, 1, 0] }
          },
          voice_verified: {
            $sum: { $cond: [{ $eq: ['$voice_verified', true] }, 1, 0] }
          },
          document_verified: {
            $sum: { $cond: [{ $eq: ['$document_verified', true] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    const summary = stats[0] || {
      total: 0,
      verified: 0,
      profile_completed: 0,
      voice_verified: 0,
      document_verified: 0
    };

    return Response.json({
      success: true,
      data: {
        users: usersList.map(user => ({
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
          admin_approved: user.admin_approved,
          payment_released: user.payment_released,
          created_at: user.created_at,
          updated_at: user.updated_at,
          verification_status: user.latest_verification?.status || null,
          voice_enrolled: user.voice_profile?.is_enrolled || false,
          enrollment_samples_count: user.voice_profile?.enrollment_samples_count || 0,
        })),
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
