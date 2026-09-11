import { afterAll, beforeAll, expect, it, vi } from 'vitest';
vi.mock('../src/lib/db', () => ({ query: vi.fn().mockRejectedValue(new Error('offline')), transaction: vi.fn() }));
import { httpTestServer } from './http-helper';
let runtime: Awaited<ReturnType<typeof httpTestServer>>;
beforeAll(async () => { runtime = await httpTestServer(); });
afterAll(async () => { await runtime.close(); });
it('health identifies the process, readiness detects unavailable storage', async () => {
  expect((await fetch(`${runtime.url}/api/healthz`)).status).toBe(200);
  expect((await fetch(`${runtime.url}/api/readyz`)).status).toBe(503);
});
