import jwt from 'jsonwebtoken';
const JWT_SECRET = (process.env.JWT_SECRET || 'dev-secret');
export function signToken(payload, expiresIn = '1h') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
export function authenticate(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token)
        return res.status(401).json({ success: false, error: { message: 'unauthorized' } });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        return res.status(401).json({ success: false, error: { message: 'invalid_token' } });
    }
}
export function requireAdmin(req, res, next) {
    const user = req.user;
    if (user?.role !== 'admin')
        return res.status(403).json({ success: false, error: { message: 'forbidden' } });
    next();
}
