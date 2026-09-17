import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { PusherService } from '../../common/pusher/pusher.service.js';
import { notifications } from '../../database/schema/notifications.schema.js';
import { events } from '../../database/schema/events.schema.js';
import { registrations } from '../../database/schema/registrations.schema.js';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'REGISTRATION' | 'ATTENDANCE' | 'CERTIFICATE' | 'ANNOUNCEMENT';
  link?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly pusherService: PusherService,
  ) {}

  /**
   * Creates a persistent in-app notification and dispatches real-time Pusher event
   */
  async createNotification(data: CreateNotificationDto) {
    const db = this.databaseService.db;

    const [record] = await db
      .insert(notifications)
      .values({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'INFO',
        link: data.link || null,
      })
      .returning();

    // Real-time Pusher dispatch to the specific user channel
    await this.pusherService.trigger(
      `user-${data.userId}`,
      'notification:new',
      record,
    );

    return record;
  }

  /**
   * Retrieves notifications for a user along with unread count
   */
  async getMyNotifications(userId: string) {
    const db = this.databaseService.db;

    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit: 30,
    });

    const unreadCount = userNotifications.filter((n) => !n.read).length;

    return {
      notifications: userNotifications,
      unreadCount,
    };
  }

  /**
   * Marks a notification as read
   */
  async markAsRead(id: string, userId: string) {
    const db = this.databaseService.db;

    const notification = await db.query.notifications.findFirst({
      where: and(eq(notifications.id, id), eq(notifications.userId, userId)),
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const [updated] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();

    return updated;
  }

  /**
   * Marks all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const db = this.databaseService.db;

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));

    return { message: 'All notifications marked as read' };
  }

  /**
   * Organizer broadcasts announcement to all registered attendees of an event
   */
  async broadcastEventAnnouncement(
    eventId: string,
    title: string,
    message: string,
    organizerUser: { id: string; role: string },
  ) {
    const db = this.databaseService.db;

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (
      organizerUser.role !== 'admin' &&
      event.organizerId !== organizerUser.id
    ) {
      throw new ForbiddenException(
        'You are not authorized to broadcast announcements for this event',
      );
    }

    // Find all confirmed registrations for this event
    const attendees = await db.query.registrations.findMany({
      where: and(
        eq(registrations.eventId, eventId),
        eq(registrations.status, 'CONFIRMED'),
      ),
    });

    // Create notifications for each attendee
    for (const attendee of attendees) {
      await db.insert(notifications).values({
        userId: attendee.userId,
        title: `[${event.title}] ${title}`,
        message,
        type: 'ANNOUNCEMENT',
        link: `/events/${event.slug}`,
      });

      await this.pusherService.trigger(
        `user-${attendee.userId}`,
        'notification:new',
        {
          title: `[${event.title}] ${title}`,
          message,
          type: 'ANNOUNCEMENT',
        },
      );
    }

    // Also broadcast on the event public channel
    await this.pusherService.trigger(`event-${event.id}`, 'event:announcement', {
      eventId: event.id,
      title,
      message,
      createdAt: new Date(),
    });

    this.logger.log(
      `Broadcasted announcement for "${event.title}" to ${attendees.length} attendees`,
    );

    return {
      message: `Announcement broadcasted to ${attendees.length} registered attendees`,
      attendeeCount: attendees.length,
    };
  }
}
