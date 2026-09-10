import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { createApp } from '../src/app';

describe('Avatar & Leaderboard API (T-211, T-212)', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = createApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('1. GET /api/leaderboard should return leaderboard list', async () => {
    const res = await fetch(`${baseUrl}/api/leaderboard`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.leaderboard)).toBe(true);
  });

  it('2. GET /api/avatar/invalid should return 404', async () => {
    const res = await fetch(`${baseUrl}/api/avatar/notfound.png`);
    expect(res.status).toBe(404);
  });

  it('3. GET /api/avatar with path traversal should be safely blocked (Phase 2)', async () => {
    const res = await fetch(`${baseUrl}/api/avatar/..%2F..%2Fpackage.json`);
    expect(res.status).toBe(404);
  });
});
