export interface Player {
  id: string;
  nickname: string;
  email?: string | null;
  phone?: string | null;
  avatar_path?: string | null;
  is_admin?: boolean;
  last_ip?: string | null;
  created_at?: string;
}

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface RoomSettings {
  maxPlayers?: number;
  autoDraw?: boolean;
  theme?: string;
  [key: string]: unknown;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  host_player_id: string;
  status: RoomStatus;
  draw_interval_ms: number;
  settings: RoomSettings;
  created_at?: string;
}

export interface RoomPlayer {
  room_id: string;
  player_id: string;
  card: BingoCard;
  marked: number[];
  joined_at?: string;
}

export type BingoLineType = 'row' | 'col' | 'diag' | 'full';

export interface BingoCard {
  // 5x5 grid: numbers[row][col], center is FREE_SPACE (0)
  numbers: number[][];
}

export interface Draw {
  id?: number;
  room_id: string;
  sequence: number;
  number: number;
  phrase?: string | null;
  drawn_at?: string;
}

export interface Win {
  id?: number;
  room_id: string;
  player_id: string;
  line_type: BingoLineType;
  score: number;
  verified: boolean;
  created_at?: string;
}

export interface ChatMessage {
  id: number;
  room_id: string;
  player_id: string;
  player?: Pick<Player, 'id' | 'nickname'>;
  body: string;
  created_at?: string;
}
