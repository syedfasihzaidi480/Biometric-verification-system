import { getMongoDb } from '@/app/api/utils/mongo';
import { auth } from '@/auth';

// GET /api/account/export – returns a full user data bundle (JSON)
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getMongoDb();
    const users = db.collection('users');
    const voiceProfiles = db.collection('voice_profiles');
    const documents = db.collection('documents');
    const verificationRequests = db.collection('verification_requests');
    const notifications = db.collection('notifications');
    const devices = db.collection('notification_devices');
    const auditLogs = db.collection('audit_logs');
    const enrollmentSessions = db.collection('voice_enrollment_sessions');
    const deletionRequests = db.collection('deletion_requests');

    const user = await users.findOne({ auth_user_id: session.user.id });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const [
      voiceProfile,
      docs,
      verifications,
      userNotifications,
      userDevices,
      logs,
      enrollments,
      deletions,
    ] = await Promise.all([
      voiceProfiles.findOne({ user_id: user.id }),
      documents.find({ user_id: user.id }).toArray(),
      verificationRequests.find({ user_id: user.id }).sort({ created_at: -1 }).toArray(),
      notifications.find({ user_id: user.id }).sort({ created_at: -1 }).limit(200).toArray(),
      devices.find({ user_id: user.id }).toArray(),
      auditLogs.find({ user_id: user.id }).sort({ created_at: -1 }).limit(500).toArray(),
      enrollmentSessions.find({ user_id: user.id }).sort({ created_at: -1 }).toArray(),
      deletionRequests.find({ user_id: user.id }).sort({ created_at: -1 }).toArray(),
    ]);

    const bundle = {
      exported_at: new Date().toISOString(),
      user,
      voice_profile: voiceProfile || null,
      verification_requests: verifications,
      documents: docs,
      facial: verifications
        .filter((v) => !!v.liveness_image_url)
        .map((v) => ({ id: v.id, image_url: v.liveness_image_url, created_at: v.created_at, status: v.status })),
      notifications: userNotifications,
      notification_devices: userDevices,
      audit_logs: logs,
      voice_enrollment_sessions: enrollments,
      deletion_requests: deletions,
    };

    return Response.json(bundle, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[Account Export] Error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'edge';