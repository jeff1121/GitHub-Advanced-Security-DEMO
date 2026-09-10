import { BingoCard, BingoLineType, Draw, Player, Room, Win } from './models';

// Client -> Server Payloads
export interface RoomJoinPayload {
  roomCode: string;
}

export interface RoomLeavePayload {
  roomCode: string;
}

export interface GameStartPayload {
  roomCode: string;
}

export interface GameDrawPayload {
  roomCode: string;
}

export interface CardMarkPayload {
  roomCode: string;
  number: number;
}

export interface BingoClaimPayload {
  roomCode: string;
  lines: BingoLineType[];
}

export interface ChatSendPayload {
  roomCode: string;
  body: string;
}

export interface PlayerKickPayload {
  roomCode: string;
  playerId: string;
}

// Server -> Client Payloads
export interface RoomStatePayload {
  room: Room;
  players: Player[];
  draws: Draw[];
  marked: number[];
  card?: BingoCard;
}

export interface PlayerJoinedPayload {
  player: Player;
}

export interface PlayerLeftPayload {
  playerId: string;
}

export interface GameStartedPayload {
  startedAt: string;
}

export interface GameDrawnPayload {
  sequence: number;
  number: number;
  phrase: string;
}

export interface GameOverPayload {
  winners: Win[];
  leaderboard: Array<{
    player: Player;
    score: number;
  }>;
}

export interface ChatBroadcastPayload {
  id: number;
  player: Pick<Player, 'id' | 'nickname'>;
  body: string;
  createdAt: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
  stack?: string;
}
