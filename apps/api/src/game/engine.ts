import { randomInt } from 'node:crypto';
import { Draw, Win, checkBingo } from '@bingoblitz/shared';
import { transaction, query } from '../lib/db';
import { AppError } from '../lib/errors';
import { lockedRoom, requireMember } from '../services/room-service';
import { generateCallingPhrase } from '../services/openai';

export class GameEngine {
  private timer?: NodeJS.Timeout;
  private stopped = false;
  constructor(public readonly code: string, private readonly broadcast: (event: string, payload: unknown) => void) {}

  async start(playerId: string) {
    const room = await transaction(async (client) => {
      const current = await lockedRoom(client, this.code);
      await requireMember(client, current.id, playerId);
      if (current.host_player_id !== playerId) throw new AppError(403, 'Only the host can start');
      if (current.status !== 'waiting') throw new AppError(409, 'Game already started');
      await client.query("UPDATE rooms SET status = 'playing' WHERE id = $1", [current.id]);
      return current;
    });
    this.broadcast('game:started', { startedAt: new Date().toISOString() });
    this.resume(room.draw_interval_ms);
  }

  resume(interval: number) {
    if (this.timer || this.stopped) return;
    this.timer = setTimeout(async () => {
      this.timer = undefined;
      try {
        const draw = await this.draw();
        if (draw) this.resume(interval);
      } catch {
        this.stopped = true;
        this.broadcast('error', { code: 'PERSISTENCE_ERROR', message: 'Automatic drawing paused: storage unavailable. Reload after service recovery.' });
      }
    }, interval);
    this.timer.unref();
  }

  async draw(hostId?: string): Promise<Draw | null> {
    const result = await transaction(async (client) => {
      const room = await lockedRoom(client, this.code);
      if (hostId) {
        await requireMember(client, room.id, hostId);
        if (room.host_player_id !== hostId) throw new AppError(403, 'Only the host can draw');
      }
      if (room.status !== 'playing') {
        if (hostId) throw new AppError(409, 'Game is not playing');
        return null;
      }
      const { rows } = await client.query<{ number: number }>('SELECT number FROM draws WHERE room_id = $1', [room.id]);
      const drawn = new Set(rows.map((row) => row.number));
      const remaining = Array.from({ length: 75 }, (_, index) => index + 1).filter((number) => !drawn.has(number));
      if (!remaining.length) return null;
      const number = remaining[randomInt(remaining.length)];
      const phrase = await generateCallingPhrase(number);
      const inserted = await client.query<Draw>(
        'INSERT INTO draws (room_id,sequence,number,phrase) VALUES ($1,$2,$3,$4) RETURNING *',
        [room.id, rows.length + 1, number, phrase]);
      return inserted.rows[0];
    });
    if (result) this.broadcast('game:drawn', result);
    // Keep the final number available for players to mark and claim; finish after a grace interval.
    if (result?.sequence === 75) {
      this.stop();
      this.timer = setTimeout(() => { void this.finishWithoutWinner().catch(() => {
        this.broadcast('error', { code: 'PERSISTENCE_ERROR', message: 'Could not finish the game' });
      }); }, 15000);
      this.timer.unref();
    }
    return result;
  }

  async mark(playerId: string, number: number) {
    return transaction(async (client) => {
      const room = await lockedRoom(client, this.code);
      const member = await requireMember(client, room.id, playerId);
      if (room.status !== 'playing') throw new AppError(409, 'Game is not playing');
      const exists = await client.query('SELECT 1 FROM draws WHERE room_id = $1 AND number = $2', [room.id, number]);
      if (!exists.rowCount || !member.card.numbers.flat().includes(number)) throw new AppError(400, 'Number is not drawn on your card');
      const marked = Array.from(new Set([...member.marked, number]));
      await client.query('UPDATE room_players SET marked = $1 WHERE room_id = $2 AND player_id = $3', [JSON.stringify(marked), room.id, playerId]);
      return marked;
    });
  }

  async claim(playerId: string) {
    const win = await transaction(async (client) => {
      const room = await lockedRoom(client, this.code);
      const member = await requireMember(client, room.id, playerId);
      if (room.status !== 'playing') throw new AppError(409, 'Game is not playing');
      const draws = await client.query<{ number: number }>('SELECT number FROM draws WHERE room_id = $1', [room.id]);
      const drawn = new Set(draws.rows.map((row) => row.number));
      const check = checkBingo(member.card, member.marked.filter((number) => drawn.has(number)));
      if (!check.hasBingo) throw new AppError(400, 'BINGO is not valid');
      const { rows } = await client.query<Win>(
        'INSERT INTO wins (room_id,player_id,line_type,score,verified) VALUES ($1,$2,$3,$4,true) RETURNING *',
        [room.id, playerId, check.lines[0], check.score]);
      await client.query("UPDATE rooms SET status = 'finished' WHERE id = $1", [room.id]);
      return rows[0];
    });
    this.stop();
    this.broadcast('game:over', { winners: [win] });
    return win;
  }

  async finishWithoutWinner() {
    const changed = await query("UPDATE rooms SET status = 'finished' WHERE code = $1 AND status = 'playing' RETURNING id", [this.code]);
    this.stop();
    if (changed.rowCount) this.broadcast('game:over', { winners: [] });
  }

  stop() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }
}
