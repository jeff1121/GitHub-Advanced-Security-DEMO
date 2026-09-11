import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { config } from './config';
import { query } from './lib/db';
import { asyncRoute, errorHandler } from './lib/errors';
import { authRouter } from './routes/auth';
import { roomsRouter } from './routes/rooms';
import { avatarRouter } from './routes/avatar';
import { leaderboardRouter } from './routes/leaderboard';
import { reportRouter } from './routes/report';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.WEB_ORIGIN }));
  app.use(express.json({ limit: '1400kb' }));
  app.get('/api/healthz', (_req, res) => res.json({ status: 'ok', service: 'bingoblitz-api' }));
  app.get('/api/readyz', asyncRoute(async (_req, res) => {
    await query('SELECT 1');
    res.json({ status: 'ready' });
  }));
  app.use('/api', rateLimit({ windowMs: 60000, limit: 600, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.use('/api/auth', rateLimit({ windowMs: 60000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false }), authRouter);
  app.use('/api/rooms', roomsRouter);
  app.use('/api/rooms', reportRouter);
  app.use('/api/avatar', avatarRouter);
  app.use('/api/leaderboard', leaderboardRouter);
  app.use(errorHandler);
  return app;
}
