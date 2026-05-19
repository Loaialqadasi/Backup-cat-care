import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './env.js';
import { logger } from './logger.js';
import { success } from './response.js';
import { errorHandler } from './error.middleware.js';
import { notFoundHandler } from './not-found.middleware.js';
import { authRoutes } from '../Layth_Amgad-CCU-S1-01-Auth/auth.routes.js';
import { catsRoutes } from '../Loai_Rafaat-CCU-S1-02-Cats/cats.routes.js';
import { emergenciesRoutes } from '../Youssef_Mostafa-CCU-S1-03-Emergencies/emergencies.routes.js';
import { donationsRoutes } from '../Mohamed_Abdelgawwad-CCU-S1-05-Donations/donations.routes.js';

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
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// 1mb limit to prevent abuse
app.use(express.json({ limit: '1mb' }));

// serve uploaded cat photos as static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// quick health check for monitoring
app.get('/api/health', (_req, res) => {
  return success(res, { status: 'ok', service: 'catcare-utm-api' });
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
