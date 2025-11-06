import { getMongoDb } from '@/app/api/utils/mongo';
import { auth } from '@/auth';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { analytics, personalized } = body || {};

    if (typeof analytics === 'undefined' && typeof personalized === 'undefined') {
      return Response.json({ error: 'No fields to update' }, { status: 400 });
    }

    const db = await getMongoDb();
    const users = db.collection('users');

    const user = await users.findOne({ auth_user_id: session.user.id });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const update = { updated_at: new Date().toISOString() };
    if (typeof analytics !== 'undefined') update.analytics_opt_in = !!analytics;
    if (typeof personalized !== 'undefined') update.personalized_opt_in = !!personalized;

    await users.updateOne({ auth_user_id: session.user.id }, { $set: update });

    return Response.json({
      success: true,
      preferences: {
        analytics_opt_in: typeof analytics !== 'undefined' ? !!analytics : !!user.analytics_opt_in,
        personalized_opt_in: typeof personalized !== 'undefined' ? !!personalized : !!user.personalized_opt_in,
      }
    });
  } catch (error) {
    console.error('[Privacy Preferences] Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'edge';