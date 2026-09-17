import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Authentication (Better Auth)
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:5000'),


  // QR Signature
  QR_HMAC_SECRET: z.string().min(16, 'QR_HMAC_SECRET must be at least 16 characters'),

  // Real-time (Pusher)
  PUSHER_APP_ID: z.string().default('sample_app_id'),
  PUSHER_KEY: z.string().default('sample_pusher_key'),
  PUSHER_SECRET: z.string().default('sample_pusher_secret'),
  PUSHER_CLUSTER: z.string().default('mt1'),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().default('sample_cloud_name'),
  CLOUDINARY_API_KEY: z.string().default('sample_api_key'),
  CLOUDINARY_API_SECRET: z.string().default('sample_api_secret'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const formattedErrors = JSON.stringify(parsed.error.format(), null, 2);
    throw new Error(`Environment validation failed:\n${formattedErrors}`);
  }
  return parsed.data;
}
