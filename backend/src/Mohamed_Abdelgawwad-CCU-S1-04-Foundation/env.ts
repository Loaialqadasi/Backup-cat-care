import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// all env vars validated at startup so we fail fast if something is missing
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535),
  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().min(1).max(65535),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string().default(''),
  DATABASE_NAME: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().min(1),
  CORS_ORIGIN: z.string().min(1),
  // TG-1: 32-byte key for AES-256 — generate with: openssl rand -hex 32
  ENCRYPTION_KEY: z.string().regex(
    /^[0-9a-fA-F]{64}$/,
    'ENCRYPTION_KEY must be a 64-character hex string (run: openssl rand -hex 32)'
  )
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${message}`);
}

export const env = parsed.data;
