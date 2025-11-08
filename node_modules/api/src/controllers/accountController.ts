import { Request, Response } from 'express';
import { archiveUserDeletion, getActiveUserById, getDeletedUserById } from '../store/usersStore.js';

export async function requestAccountDeletion(req: Request, res: Response) {
  const authUser = (req as any).user;
  const userId = authUser?.sub;
  if (!userId) {
    return res.status(401).json({ success: false, error: { message: 'unauthorized' } });
  }

  const existing = getActiveUserById(userId);
  if (!existing) {
    return res.status(404).json({ success: false, error: { message: 'user_not_found' } });
  }

  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : null;
  const metadata = req.body && typeof req.body.metadata === 'object' && !Array.isArray(req.body.metadata) ? req.body.metadata : undefined;

  const archived = archiveUserDeletion(userId, { reason, requestedBy: 'self', metadata });
  if (!archived) {
    return res.status(500).json({ success: false, error: { message: 'accountDeletion.failed' } });
  }

  return res.json({ success: true, data: { deletedUser: archived } });
}

export async function exportAccountData(req: Request, res: Response) {
  const authUser = (req as any).user;
  const userId = authUser?.sub;
  if (!userId) {
    return res.status(401).json({ success: false, error: { message: 'unauthorized' } });
  }

  const existing = getActiveUserById(userId);
  if (!existing) {
    const deletedSnapshot = getDeletedUserById(userId);
    if (deletedSnapshot) {
      return res.json({ success: true, data: { exportedAt: new Date().toISOString(), deleted: true, user: deletedSnapshot } });
    }
    return res.status(404).json({ success: false, error: { message: 'user_not_found' } });
  }

  return res.json({ success: true, data: { exportedAt: new Date().toISOString(), deleted: false, user: existing } });
}
