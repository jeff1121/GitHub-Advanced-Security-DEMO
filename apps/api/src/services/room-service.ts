import { randomInt } from 'node:crypto';
import { PoolClient } from 'pg';
import { generateBingoCard, Room, BingoCard, Player, Draw, Win } from '@bingoblitz/shared';
import { query, transaction } from '../lib/db';
import { AppError } from '../lib/errors';

export function generateRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join('');
}

export async function lockedRoom(client: PoolClient, code: string): Promise<Room> {
  const result = await client.query<Room>('SELECT * FROM rooms WHERE code = $1 FOR UPDATE', [code]);
  if (!result.rows[0]) throw new AppError(404, 'Room not found');
  return result.rows[0];
}

export async function requireMember(client: PoolClient, roomId: string, playerId: string) {
  const result = await client.query<{ card: BingoCard; marked: number[] }>(
    'SELECT card, marked FROM room_players WHERE room_id = $1 AND player_id = $2', [roomId, playerId]
  );
  if (!result.rows[0]) throw new AppError(403, 'Room membership required');
  return result.rows[0];
}

export async function createRoom(playerId: string, name: string, interval: number): Promise<Room> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const { rows } = await query<Room>(
      `INSERT INTO rooms (code, name, host_player_id, draw_interval_ms)
       VALUES ($1,$2,$3,$4) ON CONFLICT (code) DO NOTHING RETURNING *`,
      [generateRoomCode(), name, playerId, interval]
    );
    if (rows[0]) return rows[0];
  }
  throw new AppError(503, 'Could not allocate room code');
}

export async function joinRoom(code: string, playerId: string) {
  await transaction(async (client) => {
    const room = await lockedRoom(client, code);
    const banned = await client.query('SELECT 1 FROM room_bans WHERE room_id = $1 AND player_id = $2', [room.id, playerId]);
    if (banned.rowCount) throw new AppError(403, 'You have been removed from this room');
    const existing = await client.query('SELECT 1 FROM room_players WHERE room_id = $1 AND player_id = $2', [room.id, playerId]);
    if (existing.rowCount) return;
    if (room.status !== 'waiting') throw new AppError(409, 'Game already started; only existing players can reconnect');
    const count = await client.query('SELECT count(*)::int AS total FROM room_players WHERE room_id = $1', [room.id]);
    if (count.rows[0].total >= 50) throw new AppError(409, 'Room is full');
    await client.query('INSERT INTO room_players (room_id, player_id, card, marked) VALUES ($1,$2,$3,$4)',
      [room.id, playerId, JSON.stringify(generateBingoCard()), '[]']);
  });
  return roomState(code, playerId);
}

export async function roomState(code: string, playerId: string) {
  return transaction(async (client) => {
    const room = await lockedRoom(client, code);
    const member = await requireMember(client, room.id, playerId);
    const players = await client.query<Player>(
      `SELECT p.id, p.nickname, p.avatar_path FROM players p JOIN room_players rp ON p.id = rp.player_id
       WHERE rp.room_id = $1 ORDER BY rp.joined_at, p.id`, [room.id]);
    const draws = await client.query<Draw>('SELECT * FROM draws WHERE room_id = $1 ORDER BY sequence', [room.id]);
    const wins = await client.query<Win>('SELECT * FROM wins WHERE room_id = $1 ORDER BY id', [room.id]);
    const chats = await client.query(
      `SELECT c.id::int, c.body, c.created_at AS "createdAt", json_build_object('id',p.id,'nickname',p.nickname) AS player
       FROM chat_messages c JOIN players p ON c.player_id = p.id WHERE c.room_id = $1 ORDER BY c.id DESC LIMIT 100`, [room.id]);
    return { room, players: players.rows, draws: draws.rows, card: member.card, marked: member.marked,
      winners: wins.rows, messages: chats.rows.reverse() };
  });
}
