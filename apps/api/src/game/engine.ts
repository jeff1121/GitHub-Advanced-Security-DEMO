import {
  BingoCard,
  BingoLineType,
  Draw,
  Player,
  Room,
  RoomStatus,
  Win,
  checkBingo
} from '@bingoblitz/shared';
import { BingoDrawer } from './drawer';
import { query } from '../lib/db';

export interface RoomParticipant {
  player: Player;
  card: BingoCard;
  marked: number[];
  joinedAt: string;
}

export class GameEngine {
  public readonly room: Room;
  private readonly drawer: BingoDrawer;
  private readonly participants: Map<string, RoomParticipant> = new Map();
  private readonly draws: Draw[] = [];
  private readonly winners: Win[] = [];
  private drawTimer: NodeJS.Timeout | null = null;
  private onDrawCallback?: (draw: Draw) => void;
  private onGameOverCallback?: (winners: Win[]) => void;

  constructor(room: Room) {
    this.room = { ...room };
    this.drawer = new BingoDrawer();
  }

  public getStatus(): RoomStatus {
    return this.room.status;
  }

  public getPlayers(): Player[] {
    return Array.from(this.participants.values()).map((p) => p.player);
  }

  public getParticipant(playerId: string): RoomParticipant | undefined {
    return this.participants.get(playerId);
  }

  public addParticipant(player: Player, card: BingoCard): RoomParticipant {
    const participant: RoomParticipant = {
      player,
      card,
      marked: [],
      joinedAt: new Date().toISOString()
    };
    this.participants.set(player.id, participant);
    return participant;
  }

  public removeParticipant(playerId: string): void {
    this.participants.delete(playerId);
  }

  public markNumber(playerId: string, num: number): boolean {
    const participant = this.participants.get(playerId);
    if (!participant) return false;

    // Check if the number has actually been drawn or is free space
    const wasDrawn = this.draws.some((d) => d.number === num) || num === 0;
    if (!wasDrawn) return false;

    if (!participant.marked.includes(num)) {
      participant.marked.push(num);
    }
    return true;
  }

  public startGame(
    onDraw: (draw: Draw) => void,
    onGameOver: (winners: Win[]) => void
  ): boolean {
    if (this.room.status !== 'waiting') {
      return false;
    }

    this.room.status = 'playing';
    this.onDrawCallback = onDraw;
    this.onGameOverCallback = onGameOver;

    this.scheduleNextDraw();
    return true;
  }

  public manualDraw(): Draw | null {
    if (this.room.status !== 'playing') {
      return null;
    }
    return this.executeDraw();
  }

  private executeDraw(): Draw | null {
    const next = this.drawer.drawNext();
    if (!next) {
      this.finishGame();
      return null;
    }

    const draw: Draw = {
      room_id: this.room.id,
      sequence: next.sequence,
      number: next.number,
      phrase: `開出號碼：${next.number}！`,
      drawn_at: new Date().toISOString()
    };

    this.draws.push(draw);

    if (this.onDrawCallback) {
      this.onDrawCallback(draw);
    }

    // Persist draw to DB (fire and forget / async)
    query(
      'INSERT INTO draws (room_id, sequence, number, phrase) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [this.room.id, draw.sequence, draw.number, draw.phrase]
    ).catch(() => {});

    if (this.drawer.isComplete()) {
      this.finishGame();
    }

    return draw;
  }

  private scheduleNextDraw(): void {
    if (this.room.status !== 'playing') return;

    this.drawTimer = setTimeout(() => {
      if (this.room.status === 'playing') {
        this.executeDraw();
        this.scheduleNextDraw();
      }
    }, this.room.draw_interval_ms || 5000);
  }

  public verifyAndClaimBingo(
    playerId: string,
    claimedLines: BingoLineType[]
  ): { valid: boolean; score: number; win?: Win } {
    const participant = this.participants.get(playerId);
    if (!participant) {
      return { valid: false, score: 0 };
    }

    // Phase 2: Back-end verification using drawn numbers
    // Reject claims if numbers were never drawn
    const drawnNumbers = this.draws.map((d) => d.number);
    const validMarks = participant.marked.filter((n) => drawnNumbers.includes(n) || n === 0);

    const checkResult = checkBingo(participant.card, validMarks);

    if (!checkResult.hasBingo) {
      return { valid: false, score: 0 };
    }

    const primaryLine: BingoLineType =
      checkResult.lines.find((l) => claimedLines.includes(l)) || checkResult.lines[0];

    const win: Win = {
      room_id: this.room.id,
      player_id: playerId,
      line_type: primaryLine,
      score: checkResult.score,
      verified: true,
      created_at: new Date().toISOString()
    };

    this.winners.push(win);

    // Save to database
    query(
      'INSERT INTO wins (room_id, player_id, line_type, score, verified) VALUES ($1, $2, $3, $4, $5)',
      [this.room.id, playerId, win.line_type, win.score, true]
    ).catch(() => {});

    return { valid: true, score: checkResult.score, win };
  }

  public finishGame(): void {
    if (this.drawTimer) {
      clearTimeout(this.drawTimer);
      this.drawTimer = null;
    }
    this.room.status = 'finished';

    query('UPDATE rooms SET status = $1 WHERE id = $2', ['finished', this.room.id]).catch(() => {});

    if (this.onGameOverCallback) {
      this.onGameOverCallback(this.winners);
    }
  }

  public getDraws(): Draw[] {
    return [...this.draws];
  }

  public getWinners(): Win[] {
    return [...this.winners];
  }
}
