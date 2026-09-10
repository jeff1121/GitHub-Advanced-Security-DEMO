import { Room } from '@bingoblitz/shared';
import { GameEngine } from './engine';

class RoomManager {
  private roomsByCode: Map<string, GameEngine> = new Map();
  private roomsById: Map<string, GameEngine> = new Map();

  public registerRoom(room: Room): GameEngine {
    let engine = this.roomsByCode.get(room.code.toUpperCase());
    if (!engine) {
      engine = new GameEngine(room);
      this.roomsByCode.set(room.code.toUpperCase(), engine);
      this.roomsById.set(room.id, engine);
    }
    return engine;
  }

  public getByCode(code: string): GameEngine | undefined {
    return this.roomsByCode.get(code.toUpperCase());
  }

  public getById(id: string): GameEngine | undefined {
    return this.roomsById.get(id);
  }

  public removeRoom(code: string): void {
    const engine = this.roomsByCode.get(code.toUpperCase());
    if (engine) {
      this.roomsByCode.delete(code.toUpperCase());
      this.roomsById.delete(engine.room.id);
    }
  }
}

export const roomManager = new RoomManager();
