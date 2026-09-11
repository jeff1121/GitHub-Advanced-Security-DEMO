import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/shared/tests/**/*.test.ts', 'apps/api/tests/**/*.test.ts'],
    exclude: ['**/*.integration.test.ts'],
    setupFiles: ['apps/api/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['packages/shared/src/**/*.ts', 'apps/api/src/**/*.ts'],
      exclude: ['packages/shared/src/models.ts', 'packages/shared/src/events.ts', 'packages/shared/src/api.ts'],
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage'
    }
  }
});
