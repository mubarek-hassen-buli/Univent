import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DRIZZLE_PROVIDER } from './database.constants.js';
import type { DrizzleDb } from './drizzle.provider.js';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @Inject(DRIZZLE_PROVIDER)
    public readonly db: DrizzleDb,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.ping();
      this.logger.log('Successfully connected to Neon PostgreSQL database.');
    } catch (error) {
      this.logger.error(
        'Failed to connect to Neon PostgreSQL database',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async ping(): Promise<boolean> {
    await this.db.execute(sql`SELECT 1`);
    return true;
  }
}
