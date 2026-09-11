import { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { verifyToken } from '../lib/jwt';
import { requestToken } from '../lib/session';
import { AppError } from '../lib/errors';
import { RoomManager } from '../game/manager';
import { transaction } from '../lib/db';
import { lockedRoom, requireMember, roomState } from '../services/room-service';
import { roomCodeSchema } from '../routes/rooms';

const roomPayload = z.object({ roomCode: roomCodeSchema }).strict();

export function registerSocketHandlers(io: Server, manager: RoomManager) {
  io.use((socket, next) => {
    try {
      const token = z.string().max(4096).parse(socket.handshake.auth?.token ?? requestToken(socket.handshake.headers));
      socket.data.token = token;
      socket.data.user = verifyToken(token);
      next();
    } catch { next(new Error('Authentication required')); }
  });

  io.on('connection', (socket: Socket) => {
    let count = 0;
    let windowStart = Date.now();
    function on<T>(event: string, schema: z.ZodType<T>, run: (payload: T) => Promise<unknown>) {
      socket.on(event, (payload: unknown, callback: unknown) => {
        const reply = (value: unknown) => { if (typeof callback === 'function') callback(value); };
        void (async () => {
          // Revalidate expiry on every event, not only on the initial handshake.
          socket.data.user = verifyToken(socket.data.token);
          if (Date.now() - windowStart >= 10000) { count = 0; windowStart = Date.now(); }
          if (++count > 200) throw new AppError(429, 'Too many events');
          const parsed = schema.safeParse(payload);
          if (!parsed.success) throw new AppError(400, 'Invalid event payload');
          reply({ ok: true, data: await run(parsed.data) });
        })().catch((error: unknown) => {
          const message = error instanceof AppError ? error.message : 'Request failed or session expired';
          const code = error instanceof AppError ? String(error.status) : 'SERVICE_ERROR';
          reply({ ok: false, error: { code, message } });
          socket.emit('error', { code, message });
        });
      });
    }
    const playerId = () => socket.data.user.id as string;
    async function member(code: string) {
      if (!socket.rooms.has(code)) throw new AppError(403, 'Join the room channel first');
      return roomState(code, playerId());
    }

    on('room:join', roomPayload, async ({ roomCode }) => {
      const state = await roomState(roomCode, playerId());
      await socket.join(roomCode);
      socket.emit('room:state', state);
      io.to(roomCode).emit('player:joined', { player: state.players.find((player) => player.id === playerId()) });
      return state;
    });
    on('room:leave', roomPayload, async ({ roomCode }) => {
      await socket.leave(roomCode);
      socket.to(roomCode).emit('player:offline', { playerId: playerId() });
    });
    on('game:start', roomPayload, async ({ roomCode }) => {
      await member(roomCode);
      await manager.get(roomCode).start(playerId());
    });
    on('game:draw', roomPayload, async ({ roomCode }) => {
      await member(roomCode);
      return manager.get(roomCode).draw(playerId());
    });
    on('card:mark', roomPayload.extend({ number: z.number().int().min(1).max(75) }), async ({ roomCode, number }) => {
      await member(roomCode);
      return { marked: await manager.get(roomCode).mark(playerId(), number) };
    });
    on('bingo:claim', roomPayload.extend({ lines: z.array(z.enum(['row', 'col', 'diag', 'full'])).max(4).optional() }), async ({ roomCode }) => {
      await member(roomCode);
      return manager.get(roomCode).claim(playerId());
    });
    on('chat:send', roomPayload.extend({ body: z.string().trim().min(1).max(200) }), async ({ roomCode, body }) => {
      if (!socket.rooms.has(roomCode)) throw new AppError(403, 'Join the room channel first');
      const message = await transaction(async (client) => {
        const room = await lockedRoom(client, roomCode);
        await requireMember(client, room.id, playerId());
        const result = await client.query(
          'INSERT INTO chat_messages (room_id,player_id,body) VALUES ($1,$2,$3) RETURNING id::int,body,created_at AS "createdAt"',
          [room.id, playerId(), body]);
        return { ...result.rows[0], player: { id: playerId(), nickname: socket.data.user.nickname } };
      });
      io.to(roomCode).emit('chat:message', message);
      return message;
    });
    on('player:kick', roomPayload.extend({ playerId: z.string().uuid() }), async ({ roomCode, playerId: target }) => {
      await member(roomCode);
      await transaction(async (client) => {
        const room = await lockedRoom(client, roomCode);
        if (room.host_player_id !== playerId() || target === playerId()) throw new AppError(403, 'Only the host can remove another player');
        await requireMember(client, room.id, target);
        await client.query('INSERT INTO room_bans (room_id,player_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [room.id, target]);
        await client.query('DELETE FROM room_players WHERE room_id = $1 AND player_id = $2', [room.id, target]);
      });
      for (const targetSocket of await io.in(roomCode).fetchSockets()) {
        if (targetSocket.data.user?.id === target) {
          targetSocket.emit('player:kicked', { roomCode });
          await targetSocket.leave(roomCode);
        }
      }
      io.to(roomCode).emit('player:left', { playerId: target });
    });
    socket.on('disconnecting', () => {
      for (const roomCode of socket.rooms) {
        if (roomCode !== socket.id) socket.to(roomCode).emit('player:offline', { playerId: playerId() });
      }
    });
  });
}
