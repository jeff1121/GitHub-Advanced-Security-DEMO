import { Router } from 'express';
import sharp from 'sharp';
import { z } from 'zod';
import { roomState } from '../services/room-service';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { asyncRoute, AppError } from '../lib/errors';
import { roomCodeSchema } from './rooms';

export const reportRouter = Router();
reportRouter.post('/:code/report', requireAuth, asyncRoute(async (req: AuthRequest, res) => {
  const code = roomCodeSchema.safeParse(req.params.code);
  if (!code.success) throw new AppError(400, 'Invalid room code');
  const format = z.object({ format: z.literal('png').default('png') }).strict().safeParse(req.body ?? {});
  if (!format.success) throw new AppError(400, 'Only PNG reports are supported');
  const state = await roomState(code.data, req.user!.id);
  if (state.room.status !== 'finished') throw new AppError(409, 'Game is not finished');
  // Only validated room codes and server-derived numbers enter the SVG template.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="#0f172a"/><g fill="#ffffff" font-family="sans-serif" font-size="32"><text x="40" y="80">BingoBlitz ${code.data}</text><text x="40" y="170">Draws: ${state.draws.length}</text><text x="40" y="230">Winners: ${state.winners.length}</text><text x="40" y="290">Score: ${state.winners.reduce((sum, win) => sum + win.score, 0)}</text></g></svg>`;
  const image = await sharp(Buffer.from(svg)).png().toBuffer();
  res.type('png').send(image);
}));
