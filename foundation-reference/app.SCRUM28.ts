import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './env.js';
import { logger } from './logger.js';
import { success } from './response.js';
import { errorHandler } from './error.middleware.js';
import { notFoundHandler } from './not-found.middleware.js';
import { generalLimiter } from '../Layth_Amgad-CCU-S1-01-Auth/rate-limiter.middleware.js';
import { authRoutes } from '../Layth_Amgad-CCU-S1-01-Auth/auth.routes.js';
import { catsRoutes } from '../Loai_Rafaat-CCU-S1-02-Cats/cats.routes.js';
import { emergenciesRoutes } from '../Youssef_Mostafa-CCU-S1-03-Emergencies/emergencies.routes.js';
import { donationsRoutes } from '../Layth_Amgad-CCU-S1-28-Donations/donations.routes.js';
import { db } from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// skip HTTP logging in tests to keep output clean
if (env.NODE_ENV !== 'test') {
  app.use(pinoHttp());
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 1mb limit to prevent abuse
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// global rate limiter — prevents brute-force and DoS on all endpoints
app.use(generalLimiter);

// serve all uploaded files (cat photos, receipts) as static files
// use process.cwd() to match multer's uploadDir which also uses process.cwd()
// set Content-Disposition: attachment to prevent browsers from executing uploaded HTML/SVG
app.use('/uploads', (req, res, next) => {
  res.setHeader('Content-Disposition', 'attachment');
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// quick health check for monitoring — verifies database connectivity
app.get('/api/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    return success(res, { status: 'ok', service: 'catcare-utm-api', db: 'connected' });
  } catch {
    return res.status(503).json({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Database unreachable' } });
  }
});

// mount each team member's routes
app.use('/api/auth', authRoutes);
app.use('/api/cats', catsRoutes);
app.use('/api/emergencies', emergenciesRoutes);
app.use('/api/donations', donationsRoutes);

// catch-all: 404 then error handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
