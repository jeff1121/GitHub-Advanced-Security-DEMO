import http from 'node:http';
import { Server } from 'socket.io';
import { config } from './config';
import { createApp } from './app';
import { registerSocketHandlers } from './sockets/handlers';
import { RoomManager } from './game/manager';
import { pool } from './lib/db';
import { runMigrations } from './db/migrate';

export async function startServer(port = config.PORT, host = config.HOST) {
  await runMigrations();
  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: config.WEB_ORIGIN },
    maxHttpBufferSize: 16384,
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      callback(null, !origin || origin === config.WEB_ORIGIN);
    }
  });
  const manager = new RoomManager(io);
  registerSocketHandlers(io, manager);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  await manager.restore();
  return {
    app, io, server, manager,
    close: async () => {
      manager.close();
      await new Promise<void>((resolve) => io.close(() => resolve()));
    }
  };
}

if (require.main === module) {
  startServer().then((runtime) => {
    console.log(`BingoBlitz API ready on ${config.HOST}:${config.PORT}`);
    let stopping = false;
    const stop = async () => {
      if (stopping) return;
      stopping = true;
      await runtime.close();
      await pool.end();
    };
    for (const signal of ['SIGTERM', 'SIGINT']) process.once(signal, () => {
      void stop().catch(() => { console.error('Shutdown failed'); process.exitCode = 1; });
    });
  }).catch(() => {
    console.error('Startup failed: check environment and database availability.');
    void pool.end();
    process.exitCode = 1;
  });
}
