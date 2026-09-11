import { afterAll, beforeAll, expect, it } from 'vitest';
import { io, type Socket } from 'socket.io-client';
import type { AddressInfo } from 'node:net';
import type { BingoCard, Draw, Player, Room } from '@bingoblitz/shared';
import { startServer } from '../src/server';
import { pool, query } from '../src/lib/db';

let runtime: Awaited<ReturnType<typeof startServer>>;
let url: string;
const sockets: Socket[] = [];
const playerIds: string[] = [];
const roomIds: string[] = [];
interface Ack<T = unknown> { ok: boolean; data: T; error?: { message: string } }
function event<T = unknown>(socket: Socket, name: string, payload: unknown): Promise<Ack<T>> {
  return new Promise((resolve, reject) => socket.timeout(7000).emit(name, payload, (error: Error | null, result: Ack<T>) => error ? reject(error) : resolve(result)));
}
async function connect(token?: string) {
  const socket = io(url, { auth: { token }, autoConnect: false, reconnection: false });
  sockets.push(socket);
  await new Promise<void>((resolve, reject) => {
    socket.once('connect', resolve); socket.once('connect_error', reject); socket.connect();
  });
  return socket;
}
async function request<T>(path: string, token?: string, body?: unknown) {
  const response = await fetch(`${url}/api${path}`, { method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await response.json() as T;
  return { response, data };
}
beforeAll(async () => {
  runtime = await startServer(0, '127.0.0.1');
  url = `http://127.0.0.1:${(runtime.server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  for (const socket of sockets) socket.disconnect();
  if (runtime) await runtime.close();
  if (roomIds.length) await query('DELETE FROM rooms WHERE id = ANY($1::uuid[])', [roomIds]);
  if (playerIds.length) await query('DELETE FROM players WHERE id = ANY($1::uuid[])', [playerIds]);
  await pool.end();
});

it('three authenticated clients play one persisted game, with permissions, rejoin and duplicate-claim checks', async () => {
  const guests: Array<{ token: string; player: Player }> = [];
  for (let index = 0; index < 4; index++) {
    const result = await request<{ token: string; player: Player }>('/auth/guest', undefined, { nickname: `Integration ${index}` });
    expect(result.response.status).toBe(201);
    expect(result.response.headers.get('set-cookie')).toMatch(/HttpOnly/);
    expect(result.response.headers.get('set-cookie')).toMatch(/SameSite=Strict/);
    guests.push(result.data); playerIds.push(result.data.player.id);
  }
  expect(new Set(playerIds).size).toBe(4);
  await expect(connect()).rejects.toThrow(/Authentication/);
  await expect(connect('bad')).rejects.toThrow(/Authentication/);
  const created = await request<{ room: Room }>('/rooms', guests[0].token, { name: 'Integration isolated room', drawIntervalMs: 60000 });
  expect(created.response.status).toBe(201);
  const room = created.data.room; roomIds.push(room.id);
  const cards: BingoCard[] = [];
  const clients: Socket[] = [];
  for (const guest of guests) {
    const joined = await request<{ card: BingoCard }>(`/rooms/${room.code}/join`, guest.token, {});
    expect(joined.response.status).toBe(200); cards.push(joined.data.card);
    const client = await connect(guest.token); clients.push(client);
    expect((await event(client, 'room:join', { roomCode: room.code })).ok).toBe(true);
  }
  const again = await request<{ card: BingoCard }>(`/rooms/${room.code}/join`, guests[0].token, {});
  expect(again.data.card).toEqual(cards[0]);
  expect((await event(clients[0], 'game:draw', null)).ok).toBe(false);
  expect((await event(clients[1], 'game:start', { roomCode: room.code })).ok).toBe(false);
  expect((await event(clients[0], 'player:kick', { roomCode: room.code, playerId: guests[3].player.id })).ok).toBe(true);
  expect((await event(clients[3], 'chat:send', { roomCode: room.code, body: 'forbidden' })).ok).toBe(false);
  expect((await request(`/rooms/${room.code}/join`, guests[3].token, {})).response.status).toBe(403);
  expect((await event(clients[0], 'game:start', { roomCode: room.code })).ok).toBe(true);
  expect((await event(clients[1], 'game:draw', { roomCode: room.code })).ok).toBe(false);
  expect((await event(clients[0], 'card:mark', { roomCode: room.code, number: cards[0].numbers[0][0] })).ok).toBe(false);
  expect((await event(clients[0], 'bingo:claim', { roomCode: room.code, lines: ['full'] })).ok).toBe(false);
  const message = '<script>alert(1)</script>';
  expect((await event(clients[1], 'chat:send', { roomCode: room.code, body: message })).ok).toBe(true);
  const delivered: number[] = [];
  clients[2].on('game:drawn', (draw: Draw) => delivered.push(draw.number));
  const wanted = new Set(cards[0].numbers[0]);
  const drawn: number[] = [];
  while (wanted.size) {
    const result = await event<Draw>(clients[0], 'game:draw', { roomCode: room.code });
    expect(result.ok).toBe(true);
    drawn.push(result.data.number);
    if (wanted.delete(result.data.number)) expect((await event(clients[0], 'card:mark', { roomCode: room.code, number: result.data.number })).ok).toBe(true);
  }
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(delivered).toEqual(drawn);
  expect(new Set(drawn).size).toBe(drawn.length);
  clients[0].disconnect();
  const reconnected = await connect(guests[0].token);
  const state = await event<{ card: BingoCard; marked: number[]; messages: Array<{ body: string }> }>(reconnected, 'room:join', { roomCode: room.code });
  expect(state.data.card).toEqual(cards[0]);
  expect(state.data.marked).toEqual(expect.arrayContaining(cards[0].numbers[0]));
  expect(state.data.messages.some((item) => item.body === message)).toBe(true);
  expect((await event(reconnected, 'bingo:claim', { roomCode: room.code })).ok).toBe(true);
  expect((await event(reconnected, 'bingo:claim', { roomCode: room.code })).ok).toBe(false);
  expect((await query('SELECT count(*)::int AS count FROM wins WHERE room_id=$1', [room.id])).rows[0].count).toBe(1);
  expect((await query('SELECT status FROM rooms WHERE id=$1', [room.id])).rows[0].status).toBe('finished');
});
