import { Module, Global } from '@nestjs/common';
import { drizzleProvider, DRIZZLE_PROVIDER } from './drizzle.provider.js';
import { DatabaseService } from './database.service.js';

@Global()
@Module({
  providers: [drizzleProvider, DatabaseService],
  exports: [DRIZZLE_PROVIDER, DatabaseService],
})
export class DatabaseModule {}
