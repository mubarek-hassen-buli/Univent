import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { eq, and, ilike, or, desc, asc, count } from 'drizzle-orm';
import crypto from 'node:crypto';
import { DatabaseService } from '../../database/database.service.js';
import { PusherService } from '../../common/pusher/pusher.service.js';
import { events } from '../../database/schema/events.schema.js';
import { categories } from '../../database/schema/categories.schema.js';
import { user } from '../../database/schema/auth.schema.js';
import type { CreateEventDto } from './dto/create-event.dto.js';
import type { UpdateEventDto, UpdateEventStatusDto } from './dto/update-event.dto.js';
import type { QueryEventsDto } from './dto/query-events.dto.js';

@Injectable()
export class EventsService {
  constructor(
    private readonly databaseService: DatabaseService,
    @Optional() private readonly pusherService?: PusherService,
  ) {}

  private get db() {
    return this.databaseService.db;
  }

  async createEvent(organizerId: string, dto: CreateEventDto) {
    const baseSlug = dto.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 100);

    const uniqueSuffix = crypto.randomBytes(3).toString('hex');
    const slug = `${baseSlug}-${uniqueSuffix}`;

    const [createdEvent] = await this.db
      .insert(events)
      .values({
        title: dto.title,
        slug,
        description: dto.description,
        categoryId: dto.categoryId || null,
        organizerId,
        location: dto.location,
        isOnline: dto.isOnline ?? false,
        meetingLink: dto.meetingLink || null,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        capacity: dto.capacity,
        registeredCount: 0,
        version: 0,
        bannerUrl: dto.bannerUrl || null,
        status: 'PUBLISHED', // Direct publish for university organizers
      })
      .returning();

    const pusher = this.pusherService;
    if (pusher) {
      await pusher.trigger('events', 'event:created', {
        id: createdEvent.id,
        title: createdEvent.title,
        slug: createdEvent.slug,
        location: createdEvent.location,
        isOnline: createdEvent.isOnline,
        startDate: createdEvent.startDate,
        endDate: createdEvent.endDate,
        capacity: createdEvent.capacity,
        registeredCount: 0,
        remainingSeats: createdEvent.capacity,
        isSoldOut: false,
        bannerUrl: createdEvent.bannerUrl,
        status: createdEvent.status,
      });

      await pusher.trigger(`organizer-${organizerId}`, 'event:created', createdEvent);
    }

    return createdEvent;
  }

  async listEvents(query: QueryEventsDto, isPublic = true) {
    const safeLimit = Math.min(Math.max(query.limit ?? 12, 1), 50);
    const safePage = Math.max(query.page ?? 1, 1);
    const offset = (safePage - 1) * safeLimit;

    const conditions = [];

    if (isPublic) {
      conditions.push(eq(events.status, query.status ?? 'PUBLISHED'));
    } else if (query.status) {
      conditions.push(eq(events.status, query.status));
    }

    if (query.categoryId) {
      conditions.push(eq(events.categoryId, query.categoryId));
    }

    if (query.organizerId) {
      conditions.push(eq(events.organizerId, query.organizerId));
    }

    if (query.isOnline !== undefined) {
      conditions.push(eq(events.isOnline, query.isOnline));
    }

    if (query.search) {
      const searchPattern = `%${query.search.trim()}%`;
      conditions.push(
        or(
          ilike(events.title, searchPattern),
          ilike(events.description, searchPattern),
          ilike(events.location, searchPattern),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRecord] = await this.db
      .select({ value: count() })
      .from(events)
      .where(whereClause);

    const total = totalRecord?.value ?? 0;

    const eventList = await this.db
      .select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        description: events.description,
        location: events.location,
        isOnline: events.isOnline,
        meetingLink: events.meetingLink,
        startDate: events.startDate,
        endDate: events.endDate,
        capacity: events.capacity,
        registeredCount: events.registeredCount,
        bannerUrl: events.bannerUrl,
        status: events.status,
        createdAt: events.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          icon: categories.icon,
        },
        organizer: {
          id: user.id,
          name: user.name,
          image: user.image,
          department: user.department,
        },
      })
      .from(events)
      .leftJoin(categories, eq(events.categoryId, categories.id))
      .innerJoin(user, eq(events.organizerId, user.id))
      .where(whereClause)
      .orderBy(asc(events.startDate))
      .limit(safeLimit)
      .offset(offset);

    const formattedEvents = eventList.map((evt) => ({
      ...evt,
      remainingSeats: Math.max(evt.capacity - evt.registeredCount, 0),
      isSoldOut: evt.registeredCount >= evt.capacity,
    }));

    return {
      data: formattedEvents,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getEventBySlug(slug: string) {
    const [found] = await this.db
      .select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        description: events.description,
        location: events.location,
        isOnline: events.isOnline,
        meetingLink: events.meetingLink,
        startDate: events.startDate,
        endDate: events.endDate,
        capacity: events.capacity,
        registeredCount: events.registeredCount,
        version: events.version,
        bannerUrl: events.bannerUrl,
        status: events.status,
        createdAt: events.createdAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          icon: categories.icon,
        },
        organizer: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          department: user.department,
        },
      })
      .from(events)
      .leftJoin(categories, eq(events.categoryId, categories.id))
      .innerJoin(user, eq(events.organizerId, user.id))
      .where(eq(events.slug, slug))
      .limit(1);

    if (!found) {
      throw new NotFoundException(`Event '${slug}' not found`);
    }

    return {
      ...found,
      remainingSeats: Math.max(found.capacity - found.registeredCount, 0),
      isSoldOut: found.registeredCount >= found.capacity,
    };
  }

  async getEventById(id: string) {
    const [found] = await this.db
      .select()
      .from(events)
      .where(eq(events.id, id))
      .limit(1);

    if (!found) {
      throw new NotFoundException(`Event with ID '${id}' not found`);
    }

    return found;
  }

  async updateEvent(
    userId: string,
    userRole: string,
    eventId: string,
    dto: UpdateEventDto,
  ) {
    const existing = await this.getEventById(eventId);

    if (userRole !== 'admin' && existing.organizerId !== userId) {
      throw new ForbiddenException('You can only modify events you have organized');
    }

    if (dto.capacity !== undefined && dto.capacity < existing.registeredCount) {
      throw new BadRequestException(
        `Cannot set capacity to ${dto.capacity} because ${existing.registeredCount} students have already registered`,
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.isOnline !== undefined) updateData.isOnline = dto.isOnline;
    if (dto.meetingLink !== undefined) updateData.meetingLink = dto.meetingLink;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);
    if (dto.capacity !== undefined) updateData.capacity = dto.capacity;
    if (dto.bannerUrl !== undefined) updateData.bannerUrl = dto.bannerUrl;

    const [updated] = await this.db
      .update(events)
      .set(updateData)
      .where(eq(events.id, eventId))
      .returning();

    const pusher = this.pusherService;
    if (pusher) {
      await pusher.trigger('events', 'event:updated', updated);
      await pusher.trigger(`event-${eventId}`, 'event:updated', updated);
      await pusher.trigger(`organizer-${existing.organizerId}`, 'event:updated', updated);
    }

    return updated;
  }

  async updateEventStatus(
    userId: string,
    userRole: string,
    eventId: string,
    dto: UpdateEventStatusDto,
  ) {
    const existing = await this.getEventById(eventId);

    if (userRole !== 'admin' && existing.organizerId !== userId) {
      throw new ForbiddenException('You can only change status of your own events');
    }

    const [updated] = await this.db
      .update(events)
      .set({
        status: dto.status,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();

    const pusher = this.pusherService;
    if (pusher) {
      await pusher.trigger('events', 'event:status-changed', updated);
      await pusher.trigger(`event-${eventId}`, 'event:status-changed', updated);
      await pusher.trigger(`organizer-${existing.organizerId}`, 'event:status-changed', updated);
    }

    return updated;
  }

  async deleteEvent(userId: string, userRole: string, eventId: string) {
    const existing = await this.getEventById(eventId);

    if (userRole !== 'admin' && existing.organizerId !== userId) {
      throw new ForbiddenException('You can only delete your own events');
    }

    const pusher = this.pusherService;

    // If attendees have registered, soft cancel to preserve ticket and attendance history
    if (existing.registeredCount > 0) {
      const [cancelled] = await this.db
        .update(events)
        .set({
          status: 'CANCELLED',
          updatedAt: new Date(),
        })
        .where(eq(events.id, eventId))
        .returning();

      if (pusher) {
        await pusher.trigger('events', 'event:status-changed', cancelled);
        await pusher.trigger(`event-${eventId}`, 'event:status-changed', cancelled);
        await pusher.trigger(`organizer-${existing.organizerId}`, 'event:status-changed', cancelled);
      }

      return {
        message: 'Event has active registrations and was cancelled rather than deleted',
        event: cancelled,
      };
    }

    await this.db.delete(events).where(eq(events.id, eventId));

    if (pusher) {
      await pusher.trigger('events', 'event:deleted', { eventId });
      await pusher.trigger(`event-${eventId}`, 'event:deleted', { eventId });
      await pusher.trigger(`organizer-${existing.organizerId}`, 'event:deleted', { eventId });
    }

    return { message: 'Event successfully deleted' };
  }
}
