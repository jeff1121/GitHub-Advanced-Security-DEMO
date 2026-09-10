import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth';
import { roomsRouter } from './routes/rooms';
import { avatarRouter } from './routes/avatar';
import { leaderboardRouter } from './routes/leaderboard';
import { reportRouter } from './routes/report';

export const createApp = (): Express => {
  const app = express();

  // Phase 1: Clean and secure defaults (helmet & strict CORS)
  // Phase 3 will intentionally modify these for BE-12 & FE-07 demo points
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.WEB_ORIGIN || 'http://localhost:5173',
      credentials: true
    })
  );
  app.use(express.json());

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/rooms', roomsRouter);
  app.use('/api/avatar', avatarRouter);
  app.use('/api/leaderboard', leaderboardRouter);
  app.use('/api/rooms', reportRouter);

  // Health check endpoint
  app.get('/api/healthz', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'bingoblitz-api',
      timestamp: new Date().toISOString()
    });
  });

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({
      error: {
        message
      }
    });
  });

  return app;
};
