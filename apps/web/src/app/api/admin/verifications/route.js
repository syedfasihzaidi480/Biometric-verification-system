import { getMongoDb } from '@/app/api/utils/mongo';

const SORT_FIELD_MAP = {
  created_at: 'created_at',
  updated_at: 'updated_at',
  voice_match_score: 'voice_match_score',
  status: 'status',
};

function buildVerificationDto(doc) {
  const user = doc.user || {};
  const admin = doc.admin || null;
  const voiceProfile = doc.voice_profile || {};

  return {
    id: doc.id,
    user: {
      id: doc.user_id,
      name: user.name || null,
      phone: user.phone || null,
      email: user.email || null,
      preferred_language: user.preferred_language || null,
      voice_enrolled: Boolean(voiceProfile.is_enrolled),
      enrollment_samples_count: voiceProfile.enrollment_samples_count || 0,
    },
    voice_match_score: doc.voice_match_score ?? null,
    liveness_image_url: doc.liveness_image_url || null,
    document_url: doc.document_url || null,
    status: doc.status,
    admin: doc.admin_id
      ? {
          id: doc.admin_id,
          name: admin?.name || null,
        }
      : null,
    notes: doc.notes || null,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };
}

export async function GET(request) {
  try {
    const db = await getMongoDb();
    const verificationRequests = db.collection('verification_requests');

    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase();

    const match = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      match.status = status;
    }

    const sortField = SORT_FIELD_MAP[sortBy] || 'created_at';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;

    const offset = (page - 1) * limit;

    const pipeline = [
      { $match: match },
      { $sort: { [sortField]: sortDirection, created_at: -1 } },
      { $skip: offset },
      { $limit: limit },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'user' } },
      { $lookup: { from: 'users', localField: 'admin_id', foreignField: 'id', as: 'admin' } },
      { $lookup: { from: 'voice_profiles', localField: 'user_id', foreignField: 'user_id', as: 'voice_profile' } },
      {
        $addFields: {
          user: { $first: '$user' },
          admin: { $first: '$admin' },
          voice_profile: { $first: '$voice_profile' },
        },
      },
    ];

    const verifications = await verificationRequests.aggregate(pipeline).toArray();
    const total = await verificationRequests.countDocuments(match);

    console.log(`[Admin Verifications] Found ${verifications.length} verifications`);
    if (verifications.length > 0) {
      console.log('[Admin Verifications] Sample verification:', {
        id: verifications[0].id,
        user_id: verifications[0].user_id,
        user: verifications[0].user,
        status: verifications[0].status,
      });
    }

    const statusSummaryDocs = await verificationRequests
      .aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .toArray();

    const summary = statusSummaryDocs.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const mappedVerifications = verifications.map(buildVerificationDto);
    console.log('[Admin Verifications] Sample mapped verification:', mappedVerifications[0]);

    return Response.json({
      success: true,
      data: {
        verifications: mappedVerifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        summary: {
          total,
          by_status: summary,
        },
      },
    });
  } catch (error) {
    console.error('Admin verifications list error:', error);

    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred while fetching verifications',
        details: process.env.NODE_ENV === 'development' ? error.message : null,
      },
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const db = await getMongoDb();
    const verificationRequests = db.collection('verification_requests');

    const body = await request.json();
    const {
      search,
      status,
      dateFrom,
      dateTo,
      voiceScoreMin,
      voiceScoreMax,
      page = 1,
      limit = 20,
    } = body;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (parsedPage - 1) * parsedLimit;

    const match = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      match.status = status;
    }

    if (dateFrom || dateTo) {
      match.created_at = {};
      if (dateFrom) {
        const fromIso = new Date(dateFrom).toISOString();
        if (!Number.isNaN(new Date(fromIso).getTime())) {
          match.created_at.$gte = fromIso;
        }
      }
      if (dateTo) {
        const toIso = new Date(dateTo).toISOString();
        if (!Number.isNaN(new Date(toIso).getTime())) {
          match.created_at.$lte = toIso;
        }
      }
      if (Object.keys(match.created_at).length === 0) {
        delete match.created_at;
      }
    }

    if (voiceScoreMin !== undefined || voiceScoreMax !== undefined) {
      match.voice_match_score = {};
      if (voiceScoreMin !== undefined) {
        match.voice_match_score.$gte = Number(voiceScoreMin);
      }
      if (voiceScoreMax !== undefined) {
        match.voice_match_score.$lte = Number(voiceScoreMax);
      }
      if (Object.keys(match.voice_match_score).length === 0) {
        delete match.voice_match_score;
      }
    }

    const basePipeline = [
      { $match: match },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: 'id', as: 'user' } },
      { $lookup: { from: 'users', localField: 'admin_id', foreignField: 'id', as: 'admin' } },
      { $lookup: { from: 'voice_profiles', localField: 'user_id', foreignField: 'user_id', as: 'voice_profile' } },
      {
        $addFields: {
          user: { $first: '$user' },
          admin: { $first: '$admin' },
          voice_profile: { $first: '$voice_profile' },
        },
      },
    ];

    if (search) {
      basePipeline.push({
        $match: {
          $or: [
            { 'user.name': { $regex: search, $options: 'i' } },
            { 'user.phone': { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    const resultPipeline = [
      ...basePipeline,
      { $sort: { created_at: -1 } },
      { $skip: offset },
      { $limit: parsedLimit },
    ];

    const verifications = await verificationRequests.aggregate(resultPipeline).toArray();

    const countPipeline = [
      ...basePipeline,
      { $count: 'total' },
    ];

    const countResult = await verificationRequests.aggregate(countPipeline).toArray();
    const total = countResult[0]?.total || 0;

    return Response.json({
      success: true,
      data: {
        verifications: verifications.map(buildVerificationDto),
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          pages: Math.ceil(total / parsedLimit) || 1,
          hasNext: parsedPage * parsedLimit < total,
          hasPrev: parsedPage > 1,
        },
        filters: {
          search: search || null,
          status: status || null,
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          voiceScoreMin: voiceScoreMin ?? null,
          voiceScoreMax: voiceScoreMax ?? null,
        },
      },
    });
  } catch (error) {
    console.error('Admin verifications search error:', error);

    return Response.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred while searching verifications',
        details: process.env.NODE_ENV === 'development' ? error.message : null,
      },
    }, { status: 500 });
  }
}
