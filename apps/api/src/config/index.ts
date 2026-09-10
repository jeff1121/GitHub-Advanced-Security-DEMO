import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string({ required_error: 'JWT_SECRET is required' }).min(1, 'JWT_SECRET is required'),
  DEMO_FAST_MODE: z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default('true'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  MOCK_AZURE: z
    .string()
    .transform((v) => v === 'true' || v === '1')
    .default('true'),
  AZURE_OPENAI_ENDPOINT: z.string().optional(),
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_DEPLOYMENT: z.string().default('gpt-4o-mini'),
  AZURE_STORAGE_CONNECTION_STRING: z.string().optional(),
  AZURE_STORAGE_CONTAINER: z.string().default('avatars'),
  AZURE_WEBPUBSUB_CONNECTION_STRING: z.string().optional(),
  ACS_CONNECTION_STRING: z.string().optional(),
  ACS_SENDER_EMAIL: z.string().optional(),
  AZURE_KEY_VAULT_URI: z.string().optional(),
  BINGO_LICENSE_KEY: z.string().optional()
});

export type Config = z.infer<typeof envSchema>;

export const loadConfig = (overrideEnv?: Record<string, string | undefined>): Config => {
  const env = overrideEnv || process.env;

  const result = envSchema.safeParse(env);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(
      `[Config] Invalid environment configuration:\n${errorDetails}\nPlease check your .env file against .env.example`
    );
  }

  // If MOCK_AZURE is false, check for real Azure credentials
  if (!result.data.MOCK_AZURE) {
    const missingAzure: string[] = [];
    if (!result.data.AZURE_OPENAI_API_KEY) missingAzure.push('AZURE_OPENAI_API_KEY');
    if (!result.data.AZURE_STORAGE_CONNECTION_STRING)
      missingAzure.push('AZURE_STORAGE_CONNECTION_STRING');

    if (missingAzure.length > 0) {
      throw new Error(
        `[Config] Real Azure mode (MOCK_AZURE=false) requires:\n${missingAzure
          .map((k) => `  - ${k}`)
          .join('\n')}`
      );
    }
  }

  return result.data;
};

export const config = loadConfig({
  ...process.env,
  // Provide sensible test/dev fallback for JWT_SECRET and DATABASE_URL if in dev/test
  JWT_SECRET: process.env.JWT_SECRET || 'dev-local-jwt-secret-key-32-chars-min',
  DATABASE_URL:
    process.env.DATABASE_URL || 'postgres://bingo:bingo@localhost:5432/bingo'
});
