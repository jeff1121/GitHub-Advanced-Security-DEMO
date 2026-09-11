import { Router, Response } from 'express';
import { config } from '../config';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { query } from '../lib/db';
import { signToken } from '../lib/jwt';
import { comparePassword } from '../lib/hash';
import { AppError, asyncRoute } from '../lib/errors';

export const authRouter = Router();
function sessionResponse(res: Response, player: { id: string; nickname: string; avatar_path?: string }, status = 200) {
  const token = signToken(player);
  res.cookie('bingo_session', token, { httpOnly: true, sameSite: 'strict', secure: config.NODE_ENV === 'production', maxAge: 4 * 60 * 60 * 1000, path: '/' });
  return res.status(status).json({ token, player });
}
authRouter.use((req, _res, next) => {
  if (req.headers.origin && req.headers.origin !== config.WEB_ORIGIN) return next(new AppError(403, 'Origin not allowed'));
  next();
});
authRouter.get('/session', requireAuth, asyncRoute(async (req: AuthRequest, res) => {
  const result = await query('SELECT id,nickname,avatar_path FROM players WHERE id = $1', [req.user!.id]);
  if (!result.rows[0]) throw new AppError(401, 'Session player no longer exists');
  return res.json({ player: result.rows[0] });
}));
const guestSchema = z.object({
  nickname: z.string().trim().min(1).max(30), email: z.string().email().max(254).optional()
}).strict();
const loginSchema = z.object({ nickname: z.string().min(1).max(30), password: z.string().min(1).max(72) }).strict();

authRouter.post('/guest', asyncRoute(async (req, res) => {
  const parsed = guestSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Invalid nickname or email');
  const { rows } = await query<{ id: string; nickname: string; avatar_path: string }>(
    'INSERT INTO players (nickname, email) VALUES ($1, $2) RETURNING id, nickname, avatar_path',
    [parsed.data.nickname, parsed.data.email ?? null]
  );
  const player = rows[0];
  return sessionResponse(res, player, 201);
}));

authRouter.post('/login', asyncRoute(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Invalid login');
  const { rows } = await query(
    'SELECT id, nickname, avatar_path, password_hash FROM players WHERE nickname = $1 AND password_hash IS NOT NULL LIMIT 2',
    [parsed.data.nickname]
  );
  if (rows.length !== 1 || !(await comparePassword(parsed.data.password, rows[0].password_hash))) {
    throw new AppError(401, 'Invalid credentials');
  }
  const player = { id: rows[0].id, nickname: rows[0].nickname, avatar_path: rows[0].avatar_path };
  return sessionResponse(res, player);
}));
