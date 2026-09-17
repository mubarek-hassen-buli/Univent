import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DRIZZLE_PROVIDER } from '../../database/database.constants.js';
import type { DrizzleDb } from '../../database/drizzle.provider.js';
import { AUTH_INSTANCE } from './auth.constants.js';
import { createBetterAuth } from './auth.instance.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_INSTANCE,
      inject: [DRIZZLE_PROVIDER, ConfigService],
      useFactory: (db: DrizzleDb, configService: ConfigService) => {
        return createBetterAuth(db, configService);
      },
    },
    AuthService,
  ],
  exports: [AUTH_INSTANCE, AuthService],
})
export class AuthModule {}
