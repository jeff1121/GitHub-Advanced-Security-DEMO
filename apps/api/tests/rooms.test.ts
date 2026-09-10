import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import { createApp } from '../src/app';

describe('Rooms & Auth API (T-201, T-202)', () => {
  let server: http.Server;
  let baseUrl: string;
  let token: string;
  let roomCode: string;

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

  it('1. POST /api/auth/guest should create a guest token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'DemoHost' })
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(data.player.nickname).toBe('DemoHost');
    token = data.token;
  });

  it('2. POST /api/rooms should create a new room with 6-char code', async () => {
    const res = await fetch(`${baseUrl}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ name: 'Live Demo Room' })
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.room).toBeDefined();
    expect(data.room.code).toHaveLength(6);
    expect(data.room.name).toBe('Live Demo Room');
    roomCode = data.room.code;
  });

  it('3. GET /api/rooms/:code should retrieve the room', async () => {
    const res = await fetch(`${baseUrl}/api/rooms/${roomCode}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.room.code).toBe(roomCode);
    expect(data.room.name).toBe('Live Demo Room');
  });

  it('4. POST /api/rooms/:code/join should join and return a 5x5 card', async () => {
    const res = await fetch(`${baseUrl}/api/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.card).toBeDefined();
    expect(data.card.numbers).toHaveLength(5);
    expect(data.card.numbers[2][2]).toBe(0); // Center free space
  });
});
