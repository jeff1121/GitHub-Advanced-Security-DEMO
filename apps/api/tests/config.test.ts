import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config';

describe('Configuration Loader', () => {
  it('should load valid config with defaults', () => {
    const validEnv = {
      JWT_SECRET: 'test-secret',
      DATABASE_URL: 'postgres://localhost/test',
      MOCK_AZURE: 'true'
    };

    const cfg = loadConfig(validEnv);
    expect(cfg.JWT_SECRET).toBe('test-secret');
    expect(cfg.PORT).toBe(3001);
    expect(cfg.MOCK_AZURE).toBe(true);
    expect(cfg.DEMO_FAST_MODE).toBe(true);
  });

  it('should throw clear error when required variable is missing', () => {
    const invalidEnv = {
      DATABASE_URL: 'postgres://localhost/test'
      // missing JWT_SECRET
    };

    expect(() => loadConfig(invalidEnv)).toThrowError(/JWT_SECRET is required/);
  });

  it('should throw clear error when MOCK_AZURE=false and azure keys are missing', () => {
    const envMissingAzure = {
      JWT_SECRET: 'test-secret',
      DATABASE_URL: 'postgres://localhost/test',
      MOCK_AZURE: 'false'
    };

    expect(() => loadConfig(envMissingAzure)).toThrowError(/Real Azure mode/);
  });
});
