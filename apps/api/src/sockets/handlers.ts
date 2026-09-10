import { Server, Socket } from 'socket.io';
import { verifyToken, TokenPayload } from '../lib/jwt';
import { roomManager } from '../game/manager';
import {
  RoomJoinPayload,
  RoomLeavePayload,
  GameStartPayload,
  GameDrawPayload,
  CardMarkPayload,
  BingoClaimPayload,
  ChatSendPayload,
  PlayerKickPayload
} from '@bingoblitz/shared';

export interface AuthenticatedSocket extends Socket {
  user?: TokenPayload;
}

// Simple HTML sanitizer for chat in Phase 2 clean version
const sanitizeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const registerSocketHandlers = (io: Server): void => {
  // Authentication middleware for socket connections
  io.use((socket: AuthenticatedSocket, next) => {
    const token =
      socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const payload = verifyToken(token);
        socket.user = payload;
      } catch (err) {
        // Allow guest sockets without auth for initial room preview
      }
    }
    next();
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    // 1. room:join
    socket.on('room:join', ({ roomCode }: RoomJoinPayload) => {
      const code = roomCode.toUpperCase();
      const engine = roomManager.getByCode(code);
      if (!engine) {
        socket.emit('error', { code: 'ROOM_NOT_FOUND', message: '房間不存在' });
        return;
      }

      socket.join(code);

      // Send initial room state to joining client
      socket.emit('room:state', {
        room: engine.room,
        players: engine.getPlayers(),
        draws: engine.getDraws(),
        marked: socket.user ? engine.getParticipant(socket.user.id)?.marked || [] : [],
        card: socket.user ? engine.getParticipant(socket.user.id)?.card : undefined
      });

      if (socket.user) {
        // Broadcast to other players
        socket.to(code).emit('player:joined', {
          player: { id: socket.user.id, nickname: socket.user.nickname }
        });
      }
    });

    // 2. room:leave
    socket.on('room:leave', ({ roomCode }: RoomLeavePayload) => {
      const code = roomCode.toUpperCase();
      socket.leave(code);
      if (socket.user) {
        socket.to(code).emit('player:left', { playerId: socket.user.id });
      }
    });

    // 3. game:start (Phase 2: strictly check that user is the host)
    socket.on('game:start', ({ roomCode }: GameStartPayload) => {
      const code = roomCode.toUpperCase();
      const engine = roomManager.getByCode(code);
      if (!engine) return;

      if (!socket.user || socket.user.id !== engine.room.host_player_id) {
        socket.emit('error', { code: 'FORBIDDEN', message: '只有房長能開始遊戲' });
        return;
      }

      const started = engine.startGame(
        (draw) => {
          io.to(code).emit('game:drawn', draw);
        },
        (winners) => {
          io.to(code).emit('game:over', {
            winners,
            leaderboard: engine.getPlayers().map((p) => ({
              player: p,
              score: winners.find((w) => w.player_id === p.id)?.score || 0
            }))
          });
        }
      );

      if (started) {
        io.to(code).emit('game:started', { startedAt: new Date().toISOString() });
      }
    });

    // 4. game:draw (Phase 2: only host can trigger manual draw)
    socket.on('game:draw', ({ roomCode }: GameDrawPayload) => {
      const code = roomCode.toUpperCase();
      const engine = roomManager.getByCode(code);
      if (!engine) return;

      if (!socket.user || socket.user.id !== engine.room.host_player_id) {
        socket.emit('error', { code: 'FORBIDDEN', message: '只有房長能抽號' });
        return;
      }

      const draw = engine.manualDraw();
      if (draw) {
        io.to(code).emit('game:drawn', draw);
      }
    });

    // 5. card:mark
    socket.on('card:mark', ({ roomCode, number }: CardMarkPayload) => {
      if (!socket.user) return;
      const code = roomCode.toUpperCase();
      const engine = roomManager.getByCode(code);
      if (!engine) return;

      engine.markNumber(socket.user.id, number);
    });

    // 6. bingo:claim (Phase 2: server re-verifies claims against drawn numbers)
    socket.on('bingo:claim', ({ roomCode, lines }: BingoClaimPayload) => {
      if (!socket.user) return;
      const code = roomCode.toUpperCase();
      const engine = roomManager.getByCode(code);
      if (!engine) return;

      const result = engine.verifyAndClaimBingo(socket.user.id, lines);
      if (result.valid) {
        engine.finishGame();
      } else {
        socket.emit('error', { code: 'INVALID_BINGO', message: '連線無效或尚未開出該號碼' });
      }
    });

    // 7. chat:send (Phase 2: sanitize HTML)
    socket.on('chat:send', ({ roomCode, body }: ChatSendPayload) => {
      if (!socket.user) return;
      const code = roomCode.toUpperCase();
      const cleanBody = sanitizeHtml(body.trim().slice(0, 200));

      io.to(code).emit('chat:message', {
        id: Date.now(),
        player: { id: socket.user.id, nickname: socket.user.nickname },
        body: cleanBody,
        createdAt: new Date().toISOString()
      });
    });

    // 8. player:kick (Phase 2: strictly check host privileges)
    socket.on('player:kick', ({ roomCode, playerId }: PlayerKickPayload) => {
      const code = roomCode.toUpperCase();
      const engine = roomManager.getByCode(code);
      if (!engine) return;

      if (!socket.user || socket.user.id !== engine.room.host_player_id) {
        socket.emit('error', { code: 'FORBIDDEN', message: '只有房長能踢出玩家' });
        return;
      }

      engine.removeParticipant(playerId);
      io.to(code).emit('player:left', { playerId });
    });
  });
};
