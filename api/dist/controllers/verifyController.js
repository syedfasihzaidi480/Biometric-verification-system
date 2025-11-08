import multer from 'multer';
import { enrollVoice, verifyVoice, checkLiveness, verifyDocument } from '../services/ml.js';
const upload = multer();
export const uploadSingleAudio = upload.single('file');
export const uploadMultipleAudio = upload.array('files', 5);
export const uploadSingleImage = upload.single('image');
export async function verifyVoiceHandler(req, res) {
    try {
        const file = req.file;
        if (!file)
            return res.status(400).json({ success: false, error: { message: 'audio_required' } });
        const enrollmentId = req.body?.enrollmentId || null;
        let usedEnrollmentId = enrollmentId;
        if (!usedEnrollmentId) {
            const enroll = await enrollVoice([{ buffer: file.buffer, filename: file.originalname, mimetype: file.mimetype }]);
            usedEnrollmentId = enroll.enrollment_id || enroll.enrollmentId || enroll.enrollmentId || enroll.enrollmentId;
            usedEnrollmentId = usedEnrollmentId || enroll.enrollmentId || enroll.enrollment_id; // fallback
            usedEnrollmentId = usedEnrollmentId || 'enroll_' + Math.random().toString(36).slice(2, 8);
        }
        const result = await verifyVoice(usedEnrollmentId, {
            buffer: file.buffer,
            filename: file.originalname,
            mimetype: file.mimetype,
        });
        return res.json({ success: true, data: { enrollmentId: usedEnrollmentId, ...result } });
    }
    catch (e) {
        return res.status(500).json({ success: false, error: { message: e?.message || 'verify_failed' } });
    }
}
export async function livenessHandler(req, res) {
    try {
        const file = req.file;
        if (!file)
            return res.status(400).json({ success: false, error: { message: 'image_required' } });
        const result = await checkLiveness({ buffer: file.buffer, filename: file.originalname, mimetype: file.mimetype });
        return res.json({ success: true, data: result });
    }
    catch (e) {
        return res.status(500).json({ success: false, error: { message: e?.message || 'liveness_failed' } });
    }
}
export async function documentHandler(req, res) {
    try {
        const file = req.file;
        if (!file)
            return res.status(400).json({ success: false, error: { message: 'image_required' } });
        const result = await verifyDocument({ buffer: file.buffer, filename: file.originalname, mimetype: file.mimetype });
        // Placeholder presigned URL (mock)
        const url = `https://example-bucket.s3.amazonaws.com/${encodeURIComponent(file.originalname)}?signature=mock`;
        return res.json({ success: true, data: { ...result, url } });
    }
    catch (e) {
        return res.status(500).json({ success: false, error: { message: e?.message || 'document_failed' } });
    }
}
