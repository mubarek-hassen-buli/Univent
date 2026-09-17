import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';

const broadcastAnnouncementSchema = z.object({
  title: z.string().min(3).max(100),
  message: z.string().min(5).max(1000),
});

type BroadcastAnnouncementDto = z.infer<typeof broadcastAnnouncementSchema>;

@Controller('notifications')
@UseGuards(AuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Retrieves notifications for current user with unread counter
   */
  @Get()
  async getMyNotifications(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getMyNotifications(user.id);
  }

  /**
   * Marks a single notification as read
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  /**
   * Marks all notifications as read for current user
   */
  @Post('mark-all-read')
  async markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  /**
   * Organizer broadcasts announcement to all registered attendees of an event
   */
  @Post('event/:eventId/broadcast')
  @Roles('organizer', 'admin')
  async broadcastAnnouncement(
    @Param('eventId', new ParseUUIDPipe()) eventId: string,
    @Body(new ZodValidationPipe(broadcastAnnouncementSchema))
    body: BroadcastAnnouncementDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.notificationsService.broadcastEventAnnouncement(
      eventId,
      body.title,
      body.message,
      user,
    );
  }
}
