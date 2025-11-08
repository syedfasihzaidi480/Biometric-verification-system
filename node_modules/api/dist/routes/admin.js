import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { listRequests, approveRequest, rejectRequest } from '../controllers/adminController.js';
const router = Router();
router.get('/requests', authenticate, requireAdmin, listRequests);
router.post('/requests/:id/approve', authenticate, requireAdmin, approveRequest);
router.post('/requests/:id/reject', authenticate, requireAdmin, rejectRequest);
export default router;
