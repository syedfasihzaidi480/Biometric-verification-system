import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import verifyRoutes from './routes/verify.js';
import adminRoutes from './routes/admin.js';
export function createApp() {
    const app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json({ limit: '2mb' }));
    app.use(morgan('dev'));
    app.get('/health', (_req, res) => {
        res.json({ success: true, data: { status: 'ok' } });
    });
    app.use('/api/auth', authRoutes);
    app.use('/api', verifyRoutes);
    app.use('/api/admin', adminRoutes);
    return app;
}
