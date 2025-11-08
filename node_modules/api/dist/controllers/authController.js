import { signToken } from '../middleware/auth.js';
export async function register(req, res) {
    const { name, phone, email, dob, preferredLanguage } = req.body || {};
    if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ success: false, error: { message: 'registration.phoneRequired' } });
    }
    const id = 'user_' + Math.random().toString(36).slice(2, 10);
    const user = { id, name: name || '', phone, email: email || null, dob: dob || null, preferredLanguage: preferredLanguage || 'en', role: 'user' };
    const accessToken = signToken({ sub: id, role: 'user', preferredLanguage: user.preferredLanguage }, '2h');
    return res.json({ success: true, data: { user, accessToken } });
}
export async function login(req, res) {
    // This is a stub. A real impl should verify credentials or start a voice challenge session.
    const id = 'user_demo';
    const accessToken = signToken({ sub: id, role: 'user', preferredLanguage: 'en' }, '2h');
    return res.json({ success: true, data: { accessToken } });
}
