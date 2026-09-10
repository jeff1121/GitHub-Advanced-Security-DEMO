import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { createApp } from './app';
import { registerSocketHandlers } from './sockets/handlers';

dotenv.config();

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:5173';

export const startServer = (customPort: number = port) => {
  const app = createApp();
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: webOrigin,
      credentials: true
    }
  });

  registerSocketHandlers(io);

  const runningServer = server.listen(customPort, () => {
    console.log(`[BingoBlitz API] Server listening on port ${customPort}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('[BingoBlitz API] Shutting down gracefully...');
    io.close(() => {
      runningServer.close(() => {
        console.log('[BingoBlitz API] HTTP server closed.');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return { server: runningServer, io, app };
};

// Start if executed directly
if (require.main === module) {
  startServer();
}
