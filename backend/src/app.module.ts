import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { UploadsModule } from './modules/uploads/uploads.module.js';
import { RegistrationsModule } from './modules/registrations/registrations.module.js';
import { PusherModule } from './common/pusher/pusher.module.js';
import { AttendanceModule } from './modules/attendance/attendance.module.js';
import { CertificatesModule } from './modules/certificates/certificates.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    PusherModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    EventsModule,
    UploadsModule,
    RegistrationsModule,
    AttendanceModule,
    CertificatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
