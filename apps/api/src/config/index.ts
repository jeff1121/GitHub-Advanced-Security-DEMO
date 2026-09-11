import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const booleanValue = z.enum(['true', 'false']).transform((value) => value === 'true');
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(0).max(65535).default(3001),
  HOST: z.string().default('127.0.0.1'),
  WEB_ORIGIN: z.string().url().default('http://localhost:8080'),
  JWT_SECRET: z.string({ required_error: 'JWT_SECRET is required' }).min(32),
  DATABASE_URL: z.string({ required_error: 'DATABASE_URL is required' }).url().refine(
    (value) => /^postgres(?:ql)?:\/\//.test(value), 'Must be a PostgreSQL URL'
  ),
  DEMO_FAST_MODE: booleanValue.default('true'),
  MOCK_AZURE: booleanValue.default('true'),
  BLOB_DIR: z.string().default(path.resolve(__dirname, '../../../../.data/blobs'))
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  if (!result.data.MOCK_AZURE) {
    throw new Error('Real Azure mode is not implemented in this local build; set MOCK_AZURE=true.');
  }
  return result.data;
}

export const config = loadConfig();
