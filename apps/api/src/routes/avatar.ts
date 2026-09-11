import { Router } from 'express';
import { z } from 'zod';
import { saveBlob, getBlobPath } from '../services/storage';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { asyncRoute, AppError } from '../lib/errors';
import { query } from '../lib/db';

export const avatarRouter = Router();
avatarRouter.post('/', requireAuth, asyncRoute(async (req: AuthRequest, res) => {
  const parsed = z.object({ data: z.string().min(4).max(1400000).regex(/^[A-Za-z0-9+/]+={0,2}$/) }).strict().safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Invalid image data');
  const image = await saveBlob(Buffer.from(parsed.data.data, 'base64'));
  await query('UPDATE players SET avatar_path = $1 WHERE id = $2', [image.url, req.user!.id]);
  return res.status(201).json(image);
}));
avatarRouter.get('/:file', asyncRoute(async (req, res) => {
  const file = await getBlobPath(req.params.file);
  if (!file) throw new AppError(404, 'Avatar not found');
  res.type('png').setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.sendFile(file);
}));
