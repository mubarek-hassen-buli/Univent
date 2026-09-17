import { Module, Global } from '@nestjs/common';
import { drizzleProvider, DRIZZLE_PROVIDER } from './drizzle.provider.js';

@Global()
@Module({
  providers: [drizzleProvider],
  exports: [DRIZZLE_PROVIDER],
})
export class DatabaseModule {}
