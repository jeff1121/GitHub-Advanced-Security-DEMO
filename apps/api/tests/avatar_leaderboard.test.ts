import { afterAll, beforeAll, expect, it, vi } from 'vitest';
vi.mock('../src/lib/db', () => ({ query: vi.fn().mockRejectedValue(new Error('offline')), transaction: vi.fn() }));
import { httpTestServer } from './http-helper';
import { getBlobPath, saveBlob } from '../src/services/storage';
let runtime: Awaited<ReturnType<typeof httpTestServer>>;
beforeAll(async () => { runtime = await httpTestServer(); });
afterAll(async () => { await runtime.close(); });
it('does not fabricate a leaderboard during a database outage', async () => expect((await fetch(`${runtime.url}/api/leaderboard`)).status).toBe(503));
it('rejects path traversal and invalid image data', async () => {
  expect(await getBlobPath('../../package.json')).toBeNull();
  expect(await getBlobPath('../blobs-other/fake.png')).toBeNull();
  expect((await fetch(`${runtime.url}/api/avatar/..%2F..%2Fpackage.json`)).status).toBe(404);
  await expect(saveBlob(Buffer.from('<svg onload="alert(1)"/>'))).rejects.toThrow(/valid PNG/);
  await expect(saveBlob(Buffer.alloc(1024 * 1024 + 1))).rejects.toThrow(/one megabyte/);
});
