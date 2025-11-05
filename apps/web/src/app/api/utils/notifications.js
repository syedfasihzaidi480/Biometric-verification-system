/**
 * Notification utilities: store and attempt to send push via Expo
 */
import { getMongoDb } from '@/app/api/utils/mongo';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function maybeSendExpoPush(token, message) {
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[Notifications] Expo push failed:', res.status, text);
      return false;
    }
    const json = await res.json();
    if (json?.data?.status === 'error') {
      console.error('[Notifications] Expo push error:', json.data);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Notifications] Expo push error:', err);
    return false;
  }
}

/**
 * Send and store a notification for a user
 * - Always stores a record in `notifications`
 * - Attempts to send Expo push to each enabled device
 */
export async function sendUserNotification({ userId, title, body, data = {}, category = 'GENERAL' }) {
  const db = await getMongoDb();
  const notifications = db.collection('notifications');
  const devices = db.collection('notification_devices');

  const now = new Date().toISOString();
  const id = `${userId}:${Date.now()}`;

  // Store in DB (inbox)
  await notifications.insertOne({
    id,
    user_id: userId,
    title,
    body,
    data,
    category,
    read: false,
    created_at: now,
    updated_at: now,
  });

  // Fetch enabled device tokens
  const userDevices = await devices.find({ user_id: userId, enabled: true }).toArray();
  if (!userDevices.length) {
    return { stored: true, delivered: 0 };
  }

  let delivered = 0;
  for (const d of userDevices) {
    const pushMessage = {
      to: d.token,
      sound: 'default',
      title,
      body,
      data,
    };
    const ok = await maybeSendExpoPush(d.token, pushMessage);
    if (ok) delivered += 1;
  }
  return { stored: true, delivered };
}

export async function sendVerificationStatusNotification({ userId, approved }) {
  const title = approved ? 'Verification Approved' : 'Verification Update';
  const body = approved
    ? 'Your account has been approved by an admin. You now have full access.'
    : 'Your verification was reviewed. Please check your account for details.';
  const data = { type: 'verification_status', approved };
  return sendUserNotification({ userId, title, body, data, category: 'VERIFICATION' });
}
