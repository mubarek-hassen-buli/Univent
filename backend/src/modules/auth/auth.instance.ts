import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { ConfigService } from '@nestjs/config';
import * as schema from '../../database/schema/index.js';
import type { DrizzleDb } from '../../database/drizzle.provider.js';

export function createBetterAuth(db: DrizzleDb, configService: ConfigService) {
  const secret = configService.getOrThrow<string>('BETTER_AUTH_SECRET');
  const baseURL = configService.get<string>('BETTER_AUTH_URL', 'http://localhost:5000');
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret,
    baseURL,
    basePath: '/api/auth',
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: false,
          defaultValue: 'student',
          input: true,
        },
        studentId: {
          type: 'string',
          required: false,
          input: true,
        },
        department: {
          type: 'string',
          required: false,
          input: true,
        },
      },
    },
    trustedOrigins: [frontendUrl, 'http://localhost:3000'],
  });
}

export type AuthInstance = ReturnType<typeof createBetterAuth>;
