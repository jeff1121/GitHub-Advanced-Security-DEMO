import { Router, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { query } from '../lib/db';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { roomManager } from '../game/manager';
import { generateBingoCard, Room } from '@bingoblitz/shared';

export const roomsRouter = Router();

// Helper to generate 6-character room code using CSPRNG
const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return code;
};

const createRoomSchema = z.object({
  name: z.string().min(1).max(50),
  drawIntervalMs: z.number().int().min(1000).max(60000).optional().default(5000),
  settings: z.record(z.unknown()).optional().default({})
});

// GET /api/rooms/search?q=
// Phase 2: Parameterized query (Safe version)
// (Phase 3 BE-01 will replace this with SQL string concatenation)
roomsRouter.get('/search', async (req: AuthRequest, res: Response) => {
  const q = req.query.q as string;
  if (!q) {
    return res.json({ rooms: [] });
  }

  try {
    const dbRes = await query(
      'SELECT id, code, name, status, created_at FROM rooms WHERE name ILIKE $1 LIMIT 20',
      [`%${q}%`]
    );
    return res.json({ rooms: dbRes.rows });
  } catch (err: any) {
    return res.status(500).json({ error: { message: 'Database search error' } });
  }
});

// POST /api/rooms
roomsRouter.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const parseResult = createRoomSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: { message: 'Invalid room configuration' } });
  }

  const { name, drawIntervalMs, settings } = parseResult.data;
  const hostPlayerId = req.user!.id;
  const code = generateRoomCode();

  try {
    const dbRes = await query(
      `INSERT INTO rooms (code, name, host_player_id, status, draw_interval_ms, settings)
       VALUES ($1, $2, $3, 'waiting', $4, $5)
       RETURNING *`,
      [code, name, hostPlayerId, drawIntervalMs, JSON.stringify(settings)]
    );

    const room = dbRes.rows[0] as Room;
    roomManager.registerRoom(room);

    return res.status(201).json({ room });
  } catch (err: any) {
    // In-memory fallback
    const fallbackRoom: Room = {
      id: crypto.randomUUID(),
      code,
      name,
      host_player_id: hostPlayerId,
      status: 'waiting',
      draw_interval_ms: drawIntervalMs,
      settings,
      created_at: new Date().toISOString()
    };
    roomManager.registerRoom(fallbackRoom);
    return res.status(201).json({ room: fallbackRoom });
  }
});

// GET /api/rooms/:code
roomsRouter.get('/:code', async (req: AuthRequest, res: Response) => {
  const code = req.params.code.toUpperCase();
  const engine = roomManager.getByCode(code);

  if (engine) {
    return res.json({
      room: engine.room,
      players: engine.getPlayers(),
      draws: engine.getDraws().map((d) => d.number)
    });
  }

  try {
    const dbRes = await query('SELECT * FROM rooms WHERE code = $1', [code]);
    if (dbRes.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Room not found' } });
    }
    const room = dbRes.rows[0] as Room;
    roomManager.registerRoom(room);
    return res.json({ room, players: [], draws: [] });
  } catch (err) {
    return res.status(404).json({ error: { message: 'Room not found' } });
  }
});

// POST /api/rooms/:code/join
roomsRouter.post('/:code/join', requireAuth, async (req: AuthRequest, res: Response) => {
  const code = req.params.code.toUpperCase();
  let engine = roomManager.getByCode(code);

  if (!engine) {
    try {
      const dbRes = await query('SELECT * FROM rooms WHERE code = $1', [code]);
      if (dbRes.rows.length > 0) {
        engine = roomManager.registerRoom(dbRes.rows[0] as Room);
      }
    } catch (_) {}
  }

  if (!engine) {
    return res.status(404).json({ error: { message: 'Room not found' } });
  }

  const player = {
    id: req.user!.id,
    nickname: req.user!.nickname
  };

  // Generate 5x5 card for player
  const card = generateBingoCard();
  const participant = engine.addParticipant(player, card);

  // Save to DB
  query(
    `INSERT INTO room_players (room_id, player_id, card, marked)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (room_id, player_id) DO UPDATE SET card = $3`,
    [engine.room.id, player.id, JSON.stringify(card), '[]']
  ).catch(() => {});

  return res.json({
    card,
    roomState: {
      room: engine.room,
      players: engine.getPlayers(),
      draws: engine.getDraws().map((d) => d.number),
      marked: participant.marked
    }
  });
});
