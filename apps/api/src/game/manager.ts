import { Server } from 'socket.io';
import { query } from '../lib/db';
import { GameEngine } from './engine';

export class RoomManager {
  private readonly rooms = new Map<string, GameEngine>();
  constructor(private readonly io: Server) {}
  get(code: string) {
    let engine = this.rooms.get(code);
    if (!engine) {
      engine = new GameEngine(code, (event, payload) => {
        this.io.to(code).emit(event, payload);
        if (event === 'game:over') this.rooms.delete(code);
      });
      this.rooms.set(code, engine);
    }
    return engine;
  }
  async restore() {
    const { rows } = await query<{ code: string; draw_interval_ms: number }>("SELECT code,draw_interval_ms FROM rooms WHERE status = 'playing'");
    for (const row of rows) this.get(row.code).resume(row.draw_interval_ms);
  }
  close() {
    for (const engine of this.rooms.values()) engine.stop();
    this.rooms.clear();
  }
}
