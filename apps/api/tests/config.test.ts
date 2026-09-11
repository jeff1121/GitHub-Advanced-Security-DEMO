import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';

const valid = { JWT_SECRET: 'unit-test-only-strong-enough-secret-123456789', DATABASE_URL: 'postgres://test:test@127.0.0.1/test', MOCK_AZURE: 'true' };
describe('Configuration', () => {
  it('loads validated values', () => {
    const result = loadConfig(valid);
    expect(result.MOCK_AZURE).toBe(true);
    expect(result.DEMO_FAST_MODE).toBe(true);
  });
  it('rejects absent JWT secret with no fallback', () => expect(() => loadConfig({ DATABASE_URL: valid.DATABASE_URL })).toThrow(/JWT_SECRET is required/));
  it('rejects weak JWT secret', () => expect(() => loadConfig({ ...valid, JWT_SECRET: 'weak' })).toThrow(/JWT_SECRET/));
  it('rejects missing database URL', () => expect(() => loadConfig({ JWT_SECRET: valid.JWT_SECRET })).toThrow(/DATABASE_URL/));
  it('rejects unsupported real Azure mode', () => expect(() => loadConfig({ ...valid, MOCK_AZURE: 'false' })).toThrow(/not implemented/));
  it('rejects malformed booleans and ports', () => {
    expect(() => loadConfig({ ...valid, MOCK_AZURE: 'tru' })).toThrow();
    expect(() => loadConfig({ ...valid, PORT: '-1' })).toThrow();
  });
});
