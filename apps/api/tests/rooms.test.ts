import { afterAll, beforeAll, expect, it, vi } from 'vitest';
vi.mock('../src/lib/db', () => ({ query: vi.fn().mockRejectedValue(new Error('offline')), transaction: vi.fn().mockRejectedValue(new Error('offline')) }));
import { httpTestServer } from './http-helper';
import { signToken, verifyToken } from '../src/lib/jwt';
import jwt from 'jsonwebtoken';
import { config } from '../src/config';

let runtime: Awaited<ReturnType<typeof httpTestServer>>;
const player = { id: '11111111-1111-4111-8111-111111111111', nickname: 'UnitPlayer' };
beforeAll(async () => { runtime = await httpTestServer(); });
afterAll(async () => { await runtime.close(); });
it('database failures never mint a fallback guest or room', async () => {
  const guest = await fetch(`${runtime.url}/api/auth/guest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname: 'Unit' }) });
  expect(guest.status).toBe(503);
  expect(await guest.json()).not.toHaveProperty('token');
  const room = await fetch(`${runtime.url}/api/rooms`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${signToken(player)}` }, body: JSON.stringify({ name: 'UnitRoom' }) });
  expect(room.status).toBe(503);
  expect(await room.json()).not.toHaveProperty('room');
});
it('rejects missing and invalid authentication', async () => {
  expect((await fetch(`${runtime.url}/api/rooms/ABC123`)).status).toBe(401);
  expect((await fetch(`${runtime.url}/api/rooms/ABC123`, { headers: { Authorization: 'Bearer bad' } })).status).toBe(401);
});
it('rejects mass assignment and malformed room parameters', async () => {
  const result = await fetch(`${runtime.url}/api/auth/guest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname: 'Unit', is_admin: true }) });
  expect(result.status).toBe(400);
  expect((await fetch(`${runtime.url}/api/rooms/invalid`, { headers: { Authorization: `Bearer ${signToken(player)}` } })).status).toBe(400);
});
it('verifies expiry and rejects unsigned tokens', () => {
  expect(verifyToken(signToken(player))).toEqual(player);
  const expired = jwt.sign(player, config.JWT_SECRET, { algorithm: 'HS256', expiresIn: -1, issuer: 'bingoblitz', audience: 'bingoblitz-local' });
  expect(() => verifyToken(expired)).toThrow();
  const unsigned = jwt.sign(player, '', { algorithm: 'none' });
  expect(() => verifyToken(unsigned)).toThrow();
});
