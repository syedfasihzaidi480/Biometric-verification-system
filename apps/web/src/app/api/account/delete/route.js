import { getMongoDb } from '@/app/api/utils/mongo';
import { auth } from '@/auth';

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getMongoDb();
  const users = db.collection('users');
  const deletionRequests = db.collection('deletion_requests');
  const auditLogs = db.collection('audit_logs');
  const voiceProfiles = db.collection('voice_profiles');
  const documents = db.collection('documents');
  const verificationRequests = db.collection('verification_requests');
  const notifications = db.collection('notifications');
  const devices = db.collection('notification_devices');
  const enrollmentSessions = db.collection('voice_enrollment_sessions');

    const user = await users.findOne({ auth_user_id: session.user.id });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const reqId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());

    const body = await request.json().catch(() => ({}));
    const immediate = body?.immediate !== false; // default true

    await deletionRequests.insertOne({
      id: reqId,
      user_id: user.id,
      auth_user_id: session.user.id,
      status: immediate ? 'completed' : 'requested',
      created_at: now,
      updated_at: now,
      completed_at: immediate ? now : null,
    });

    if (immediate) {
      // Cascade delete/scrub user-related data
      await Promise.allSettled([
        voiceProfiles.deleteMany({ user_id: user.id }),
        documents.deleteMany({ user_id: user.id }),
        verificationRequests.deleteMany({ user_id: user.id }),
        notifications.deleteMany({ user_id: user.id }),
        devices.deleteMany({ user_id: user.id }),
        enrollmentSessions.deleteMany({ user_id: user.id }),
      ]);

      // Scrub the user document (soft-delete)
      await users.updateOne(
        { id: user.id },
        {
          $set: {
            name: 'Deleted User',
            email: '',
            phone: null,
            date_of_birth: null,
            preferred_language: 'en',
            admin_approved: false,
            profile_completed: false,
            voice_verified: false,
            face_verified: false,
            document_verified: false,
            payment_released: false,
            notifications_enabled: false,
            account_status: 'deleted',
            deletion_requested_at: now,
            deleted_at: now,
            updated_at: now,
          },
        }
      );
    } else {
      await users.updateOne(
        { id: user.id },
        { $set: { deletion_requested_at: now, account_status: 'deletion_requested', updated_at: now } }
      );
    }

    try {
      await auditLogs.insertOne({
        user_id: user.id,
        action: immediate ? 'ACCOUNT_DELETED' : 'ACCOUNT_DELETION_REQUESTED',
        details: { request_id: reqId, immediate },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        created_at: now,
      });
    } catch {}

    return Response.json({ success: true, request_id: reqId, immediate });
  } catch (error) {
    console.error('[Account Delete] Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'edge';