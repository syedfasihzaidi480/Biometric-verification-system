import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET: Secret = (process.env.JWT_SECRET || 'dev-secret') as Secret;

export function signToken(payload: object, expiresIn: SignOptions['expiresIn'] = '1h') {
  return jwt.sign(payload as any, JWT_SECRET, { expiresIn } as SignOptions);
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: { message: 'unauthorized' } });
  try {
  const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: { message: 'invalid_token' } });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (user?.role !== 'admin') return res.status(403).json({ success: false, error: { message: 'forbidden' } });
  next();
}
