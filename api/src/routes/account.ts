import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { exportAccountData, requestAccountDeletion } from '../controllers/accountController.js';

const router = Router();

router.get('/export', authenticate, exportAccountData);
router.post('/delete', authenticate, requestAccountDeletion);

export default router;
