import { Request, Response } from 'express';
import { signToken } from '../middleware/auth.js';
import { createUser, findActiveUserByEmail, findActiveUserByPhone } from '../store/usersStore.js';

export async function register(req: Request, res: Response) {
  const { name, phone, email, dob, preferredLanguage } = req.body || {};
  const dateOfBirth = (typeof req.body?.date_of_birth === 'string' && req.body.date_of_birth.trim()) || (typeof dob === 'string' && dob.trim()) || null;
  const pensionNumber = typeof req.body?.pension_number === 'string' ? req.body.pension_number.trim() : null;
  const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
  const normalizedEmail = typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : (typeof req.body?.email === 'string' && req.body.email.trim() ? req.body.email.trim().toLowerCase() : null);
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  const preferredLang = typeof preferredLanguage === 'string' && preferredLanguage.trim()
    ? preferredLanguage.trim()
    : (typeof req.body?.preferred_language === 'string' && req.body.preferred_language.trim() ? req.body.preferred_language.trim() : 'en');

  if (!normalizedPhone) {
    return res.status(400).json({ success: false, error: { message: 'registration.phoneRequired' } });
  }
  if (findActiveUserByPhone(normalizedPhone)) {
    return res.status(409).json({ success: false, error: { code: 'PHONE_EXISTS', message: 'A user with this phone number already exists.' } });
  }
  if (normalizedEmail && findActiveUserByEmail(normalizedEmail)) {
    return res.status(409).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'A user with this email already exists.' } });
  }
  const id = 'user_' + Math.random().toString(36).slice(2, 10);
  const user = createUser({
    id,
    name: normalizedName,
    phone: normalizedPhone,
    email: normalizedEmail,
    dob: dateOfBirth,
    preferredLanguage: preferredLang,
    role: 'user',
    metadata: {
      pensionNumber,
      hasPassword: typeof req.body?.password === 'string' && !!req.body.password.trim(),
      registeredVia: req.body?.source || 'mobile-app',
    },
  });
  const accessToken = signToken({ sub: id, role: 'user', preferredLanguage: user.preferredLanguage }, '2h');
  return res.json({ success: true, data: { user, accessToken } });
}

export async function login(req: Request, res: Response) {
  // This is a stub. A real impl should verify credentials or start a voice challenge session.
  const id = 'user_demo';
  const accessToken = signToken({ sub: id, role: 'user', preferredLanguage: 'en' }, '2h');
  return res.json({ success: true, data: { accessToken } });
}
