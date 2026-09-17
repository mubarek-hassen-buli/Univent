import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export const DRIZZLE_PROVIDER = 'DRIZZLE_PROVIDER';

export type DrizzleDb = PostgresJsDatabase;

export const drizzleProvider: FactoryProvider = {
  provide: DRIZZLE_PROVIDER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const connectionString = configService.getOrThrow<string>('DATABASE_URL');

    // Resilient connection pool configuration
    const queryClient = postgres(connectionString, {
      max: 20, // Maximum connections in pool
      idle_timeout: 30, // Idle timeout in seconds
      connect_timeout: 10, // Connection timeout in seconds
      max_lifetime: 60 * 30, // 30 minutes connection lifetime
      prepare: false, // Recommended for serverless/pooled Postgres (Neon)
    });

    return drizzle(queryClient);
  },
};
