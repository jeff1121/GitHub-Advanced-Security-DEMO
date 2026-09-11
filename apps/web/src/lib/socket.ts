import { io, Socket } from 'socket.io-client';

export function createSocket(): Socket {
  return io({ autoConnect: false, reconnection: true, reconnectionAttempts: 10 });
}
export function emitRequest<T>(socket: Socket, event: string, payload: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.timeout(7000).emit(event, payload, (error: Error | null, response: { ok: boolean; data: T; error?: { message: string } }) => {
      if (error) reject(new Error('Connection timed out; reload to synchronize room state.'));
      else if (!response?.ok) reject(new Error(response?.error?.message || 'Request failed'));
      else resolve(response.data);
    });
  });
}
