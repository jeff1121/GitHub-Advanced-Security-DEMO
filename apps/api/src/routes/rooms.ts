import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { query, transaction } from '../lib/db';
import { AppError, asyncRoute } from '../lib/errors';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { createRoom, joinRoom, lockedRoom, requireMember, roomState } from '../services/room-service';

export const roomsRouter = Router();
export const roomCodeSchema = z.string().regex(/^[A-Z0-9]{6}$/);
const createSchema = z.object({
  name: z.string().trim().min(1).max(50), drawIntervalMs: z.number().int().min(1000).max(60000).optional()
}).strict();

roomsRouter.use(requireAuth);
roomsRouter.get('/search', asyncRoute(async (req, res) => {
  const parsed = z.string().max(100).safeParse(req.query.q ?? '');
  if (!parsed.success) throw new AppError(400, 'Invalid search query');
  const result = await query('SELECT code,name,status FROM rooms WHERE name ILIKE $1 LIMIT 20', [`%${parsed.data}%`]);
  return res.json({ rooms: result.rows });
}));
roomsRouter.post('/', asyncRoute(async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Invalid room configuration');
  const interval = parsed.data.drawIntervalMs ?? (config.DEMO_FAST_MODE ? 1000 : 5000);
  const room = await createRoom(req.user!.id, parsed.data.name, interval);
  return res.status(201).json({ room });
}));
roomsRouter.use('/:code', (req, _res, next) => {
  const parsed = roomCodeSchema.safeParse(req.params.code);
  if (!parsed.success) return next(new AppError(400, 'Invalid room code'));
  next();
});
roomsRouter.get('/:code', asyncRoute(async (req: AuthRequest, res) => {
  return res.json(await roomState(req.params.code, req.user!.id));
}));
roomsRouter.post('/:code/join', asyncRoute(async (req: AuthRequest, res) => {
  const state = await joinRoom(req.params.code, req.user!.id);
  return res.json({ card: state.card, roomState: state });
}));
roomsRouter.patch('/:code/settings', asyncRoute(async (req: AuthRequest, res) => {
  const parsed = z.object({ drawIntervalMs: z.number().int().min(1000).max(60000) }).strict().safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Invalid settings');
  const room = await transaction(async (client) => {
    const current = await lockedRoom(client, req.params.code);
    await requireMember(client, current.id, req.user!.id);
    if (current.host_player_id !== req.user!.id) throw new AppError(403, 'Only the host can change settings');
    if (current.status !== 'waiting') throw new AppError(409, 'Game already started');
    const result = await client.query('UPDATE rooms SET draw_interval_ms = $1 WHERE id = $2 RETURNING *', [parsed.data.drawIntervalMs, current.id]);
    return result.rows[0];
  });
  return res.json({ room });
}));
