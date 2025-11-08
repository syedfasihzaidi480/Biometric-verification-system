import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { verifyVoiceHandler, uploadSingleAudio, livenessHandler, uploadSingleImage, documentHandler } from '../controllers/verifyController.js';

const router = Router();

router.post('/verify-voice', authenticate, uploadSingleAudio, verifyVoiceHandler);
router.post('/liveness', authenticate, uploadSingleImage, livenessHandler);
router.post('/document', authenticate, uploadSingleImage, documentHandler);

export default router;
