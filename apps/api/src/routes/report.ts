import { Router, Request, Response } from 'express';
import { roomManager } from '../game/manager';

export const reportRouter = Router();

// POST /api/rooms/:code/report
// Phase 2: Safe JSON/SVG report generation
// (Phase 3 BE-02 will replace this with shell exec for Command Injection demo)
reportRouter.post('/:code/report', (req: Request, res: Response) => {
  const code = req.params.code.toUpperCase();
  const engine = roomManager.getByCode(code);

  if (!engine) {
    return res.status(404).json({ error: { message: 'Room not found' } });
  }

  const report = {
    roomCode: code,
    roomName: engine.room.name,
    totalDraws: engine.getDraws().length,
    draws: engine.getDraws().map((d) => d.number),
    winners: engine.getWinners(),
    generatedAt: new Date().toISOString()
  };

  return res.json({ report });
});
