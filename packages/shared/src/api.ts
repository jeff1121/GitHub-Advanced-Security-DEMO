import { BingoCard, BingoLineType, Player, Room } from './models';

// Auth
export interface GuestLoginRequest {
  nickname: string;
  email?: string;
}

export interface GuestLoginResponse {
  token: string;
  player: Player;
}

// Rooms
export interface CreateRoomRequest {
  name: string;
  drawIntervalMs?: number;
}

export interface CreateRoomResponse {
  room: Room;
}

export interface JoinRoomResponse {
  card: BingoCard;
  roomState: {
    room: Room;
    players: Player[];
    draws: number[];
  };
}

// Scoring service contract
export interface ScoreVerifyRequest {
  card: BingoCard;
  marked: number[];
  draws: number[];
}

export interface ScoreVerifyResponse {
  valid: boolean;
  lines: BingoLineType[];
  score: number;
}
