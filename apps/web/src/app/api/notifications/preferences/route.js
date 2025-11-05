import { getMongoDb } from '@/app/api/utils/mongo';

// POST /api/notifications/preferences
// Body: { enabled: boolean, token?: string, platform?: 'ios'|'android'|'web', userId?: string }
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { enabled, token = null, platform = 'unknown', userId } = body || {};

    if (typeof enabled !== 'boolean') {
      return Response.json({ error: 'enabled is required' }, { status: 400 });
    }

    const db = await getMongoDb();
    const users = db.collection('users');
    const devices = db.collection('notification_devices');

    let user = null;
    if (userId) {
      // Try to find by auth_user_id, then by id
      user = await users.findOne({ auth_user_id: userId });
      if (!user) {
        user = await users.findOne({ id: userId });
      }
    }

    if (!user) {
      // Allow anonymous preference save without user bind (no-op for devices)
      return Response.json({ success: true, saved: { notifications_enabled: enabled } });
    }

    const nowIso = new Date().toISOString();
    // Save preference on the user record
    await users.updateOne(
      { id: user.id },
      { $set: { notifications_enabled: !!enabled, updated_at: nowIso } }
    );

    // Upsert device token if provided
    if (token) {
      await devices.updateOne(
        { token },
        {
          $set: {
            token,
            auth_user_id: user.auth_user_id || null,
            user_id: user.id,
            platform,
            enabled: !!enabled,
            updated_at: nowIso,
          },
          $setOnInsert: {
            created_at: nowIso,
            id: `${user.id}:${platform}`,
          },
        },
        { upsert: true }
      );
    }

    return Response.json({ success: true });
  } catch (e) {
    console.error('[NOTIFICATION_PREFERENCES] Error', e);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
