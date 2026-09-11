import { Router } from 'express';
import { query } from '../lib/db';
import { asyncRoute } from '../lib/errors';

export const leaderboardRouter = Router();
leaderboardRouter.get('/', asyncRoute(async (_req, res) => {
  const result = await query(`
    SELECT p.id,p.nickname,p.avatar_path,COALESCE(SUM(w.score),0)::int AS total_score,COUNT(w.id)::int AS wins_count
    FROM players p LEFT JOIN wins w ON p.id = w.player_id AND w.verified = true
    GROUP BY p.id ORDER BY total_score DESC, wins_count DESC, p.id LIMIT 20
  `);
  return res.json({ leaderboard: result.rows });
}));
