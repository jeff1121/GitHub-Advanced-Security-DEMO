import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'apps/web/tests',
  testMatch: '**/*.e2e.ts',
  timeout: 120000,
  workers: 1,
  use: { baseURL: process.env.DEMO_URL || 'http://localhost:8080', headless: true, trace: 'retain-on-failure' },
  reporter: [['list']],
  outputDir: 'test-results'
});
