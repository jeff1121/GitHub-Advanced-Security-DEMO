import { Router, Request, Response } from 'express';
import { query } from '../lib/db';

export const leaderboardRouter = Router();

// GET /api/leaderboard
// Phase 2: Clean single JOIN query
// (Phase 3 CQ-06 will replace this with an N+1 loop for Copilot Review demo)
leaderboardRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const dbRes = await query(`
      SELECT
        p.id,
        p.nickname,
        p.avatar_path,
        COALESCE(SUM(w.score), 0)::int AS total_score,
        COUNT(w.id)::int AS wins_count
      FROM players p
      LEFT JOIN wins w ON p.id = w.player_id
      GROUP BY p.id
      ORDER BY total_score DESC, wins_count DESC
      LIMIT 20
    `);

    return res.json({ leaderboard: dbRes.rows });
  } catch (err: any) {
    // In-memory fallback if DB not connected
    return res.json({
      leaderboard: [
        { id: '1', nickname: 'BingoMaster', total_score: 1200, wins_count: 5 },
        { id: '2', nickname: 'LuckySeven', total_score: 800, wins_count: 3 },
        { id: '3', nickname: 'FastCaller', total_score: 500, wins_count: 2 }
      ]
    });
  }
});
