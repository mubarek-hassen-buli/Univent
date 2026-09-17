import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, sql, desc } from 'drizzle-orm';
import crypto from 'node:crypto';
import { DatabaseService } from '../../database/database.service.js';
import { PusherService } from '../../common/pusher/pusher.service.js';
import { registrations } from '../../database/schema/registrations.schema.js';
import { events } from '../../database/schema/events.schema.js';
import { attendance } from '../../database/schema/attendance.schema.js';
import { user } from '../../database/schema/auth.schema.js';
import { categories } from '../../database/schema/categories.schema.js';

@Injectable()
export class RegistrationsService {
  private readonly qrSecret: string;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    @Optional() private readonly pusherService?: PusherService,
  ) {
    this.qrSecret = this.configService.getOrThrow<string>('QR_HMAC_SECRET');
  }

  private get db() {
    return this.databaseService.db;
  }

  /**
   * Generates a unique, readable registration ticket code (e.g. UNIV-A1B2C3D4)
   */
  generateRegistrationCode(): string {
    return `UNIV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  /**
   * Generates a cryptographically signed QR code token
   * Format: registrationId:eventId:userId:timestamp:hmacSignature
   */
  generateQrHash(registrationId: string, eventId: string, userId: string): string {
    const timestamp = Date.now();
    const payload = `${registrationId}:${eventId}:${userId}:${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.qrSecret)
      .update(payload)
      .digest('hex');
    return `${payload}:${signature}`;
  }

  /**
   * Verifies the cryptographic HMAC signature of a QR token
   */
  verifyQrHash(qrHash: string): {
    valid: boolean;
    registrationId?: string;
    eventId?: string;
    userId?: string;
    timestamp?: number;
  } {
    const parts = qrHash.split(':');
    if (parts.length !== 5) {
      return { valid: false };
    }

    const [registrationId, eventId, userId, timestampStr, signature] = parts;
    const payload = `${registrationId}:${eventId}:${userId}:${timestampStr}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.qrSecret)
      .update(payload)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );

    if (!isValid) {
      return { valid: false };
    }

    return {
      valid: true,
      registrationId,
      eventId,
      userId,
      timestamp: parseInt(timestampStr, 10),
    };
  }

  /**
   * Concurrency-safe event registration with Optimistic Concurrency Control (OCC)
   * and multi-statement transaction wrapping.
   */
  async registerForEvent(userId: string, eventId: string) {
    // 1. Verify user is not already registered
    const [existing] = await this.db
      .select({ id: registrations.id })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, eventId),
          eq(registrations.userId, userId),
          eq(registrations.status, 'CONFIRMED'),
        ),
      )
      .limit(1);

    if (existing) {
      throw new ConflictException('You are already registered for this event');
    }

    // 2. Fetch event metadata
    const [event] = await this.db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== 'PUBLISHED') {
      throw new BadRequestException('This event is not open for registration');
    }

    if (event.registeredCount >= event.capacity) {
      throw new ConflictException('Event is sold out. No seats available.');
    }

    // 3. Execute atomic capacity reservation and registration within a strict transaction
    const result = await this.db.transaction(async (tx) => {
      // Atomic increment with capacity guard: prevents race conditions and overbooking
      const [updatedEvent] = await tx
        .update(events)
        .set({
          registeredCount: sql`${events.registeredCount} + 1`,
          version: sql`${events.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(events.id, eventId),
            sql`${events.registeredCount} < ${events.capacity}`,
          ),
        )
        .returning({
          id: events.id,
          registeredCount: events.registeredCount,
          capacity: events.capacity,
        });

      if (!updatedEvent) {
        throw new ConflictException(
          'Event is sold out. Capacity reached concurrently, please retry.',
        );
      }

      // Generate cryptographically secure registration code & QR token
      const registrationCode = this.generateRegistrationCode();
      const tempId = crypto.randomUUID();
      const qrHash = this.generateQrHash(tempId, event.id, userId);

      const [newRegistration] = await tx
        .insert(registrations)
        .values({
          id: tempId,
          eventId: event.id,
          userId,
          registrationCode,
          qrHash,
          status: 'CONFIRMED',
        })
        .returning();

      return {
        registration: newRegistration,
        event: {
          id: event.id,
          title: event.title,
          slug: event.slug,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          isOnline: event.isOnline,
        },
      };
    });

    const pusher = this.pusherService;
    if (pusher) {
      const remaining = event.capacity - (event.registeredCount + 1);
      await pusher.trigger(`event-${event.id}`, 'event:seat-update', {
        eventId: event.id,
        registeredCount: event.registeredCount + 1,
        capacity: event.capacity,
        remainingSeats: Math.max(remaining, 0),
        isSoldOut: remaining <= 0,
      });
    }

    return result;
  }

  /**
   * Retrieves all active and historical tickets for the authenticated student
   */
  async getMyTickets(userId: string) {
    const list = await this.db
      .select({
        id: registrations.id,
        registrationCode: registrations.registrationCode,
        qrHash: registrations.qrHash,
        status: registrations.status,
        registeredAt: registrations.registeredAt,
        event: {
          id: events.id,
          title: events.title,
          slug: events.slug,
          description: events.description,
          location: events.location,
          isOnline: events.isOnline,
          meetingLink: events.meetingLink,
          startDate: events.startDate,
          endDate: events.endDate,
          bannerUrl: events.bannerUrl,
          status: events.status,
        },
        category: {
          name: categories.name,
          slug: categories.slug,
        },
        organizer: {
          name: user.name,
          department: user.department,
        },
        attendedAt: attendance.scannedAt,
      })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .leftJoin(categories, eq(events.categoryId, categories.id))
      .innerJoin(user, eq(events.organizerId, user.id))
      .leftJoin(attendance, eq(attendance.registrationId, registrations.id))
      .where(eq(registrations.userId, userId))
      .orderBy(desc(events.startDate));

    return list.map((item) => ({
      ...item,
      hasAttended: !!item.attendedAt,
    }));
  }

  /**
   * Retrieves a single ticket with full digital pass details
   */
  async getTicketById(userId: string, userRole: string, registrationId: string) {
    const [ticket] = await this.db
      .select({
        id: registrations.id,
        registrationCode: registrations.registrationCode,
        qrHash: registrations.qrHash,
        status: registrations.status,
        registeredAt: registrations.registeredAt,
        student: {
          id: user.id,
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          department: user.department,
        },
        event: {
          id: events.id,
          title: events.title,
          slug: events.slug,
          location: events.location,
          isOnline: events.isOnline,
          meetingLink: events.meetingLink,
          startDate: events.startDate,
          endDate: events.endDate,
          bannerUrl: events.bannerUrl,
          organizerId: events.organizerId,
        },
        attendedAt: attendance.scannedAt,
      })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .innerJoin(user, eq(registrations.userId, user.id))
      .leftJoin(attendance, eq(attendance.registrationId, registrations.id))
      .where(eq(registrations.id, registrationId))
      .limit(1);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Access check: Only the attendee, organizer of event, or admin can view ticket
    if (
      userRole !== 'admin' &&
      ticket.student.id !== userId &&
      ticket.event.organizerId !== userId
    ) {
      throw new ForbiddenException('You are not authorized to view this ticket');
    }

    return {
      ...ticket,
      hasAttended: !!ticket.attendedAt,
    };
  }

  /**
   * Cancels ticket registration and atomically releases seat capacity back to event pool
   */
  async cancelRegistration(userId: string, registrationId: string) {
    const [existing] = await this.db
      .select()
      .from(registrations)
      .where(
        and(
          eq(registrations.id, registrationId),
          eq(registrations.userId, userId),
          eq(registrations.status, 'CONFIRMED'),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Active registration not found to cancel');
    }

    const result = await this.db.transaction(async (tx) => {
      // 1. Mark registration as CANCELLED
      const [cancelledReg] = await tx
        .update(registrations)
        .set({
          status: 'CANCELLED',
          updatedAt: new Date(),
        })
        .where(eq(registrations.id, registrationId))
        .returning();

      // 2. Decrement registered_count atomically
      await tx
        .update(events)
        .set({
          registeredCount: sql`GREATEST(${events.registeredCount} - 1, 0)`,
          version: sql`${events.version} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(events.id, existing.eventId));

      return {
        message: 'Registration successfully cancelled. Seat has been released.',
        registration: cancelledReg,
      };
    });

    const pusher = this.pusherService;
    if (pusher) {
      const [updatedEvent] = await this.db
        .select({
          capacity: events.capacity,
          registeredCount: events.registeredCount,
        })
        .from(events)
        .where(eq(events.id, existing.eventId));

      if (updatedEvent) {
        const remaining = updatedEvent.capacity - updatedEvent.registeredCount;
        await pusher.trigger(
          `event-${existing.eventId}`,
          'event:seat-update',
          {
            eventId: existing.eventId,
            registeredCount: updatedEvent.registeredCount,
            capacity: updatedEvent.capacity,
            remainingSeats: Math.max(remaining, 0),
            isSoldOut: remaining <= 0,
          },
        );
      }
    }

    return result;
  }

  /**
   * Retrieves full attendee roster for event organizer
   */
  async getEventAttendees(organizerId: string, userRole: string, eventId: string) {
    const [event] = await this.db
      .select({ organizerId: events.organizerId })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (userRole !== 'admin' && event.organizerId !== organizerId) {
      throw new ForbiddenException('Only the event organizer can view the attendee roster');
    }

    const attendees = await this.db
      .select({
        id: registrations.id,
        registrationCode: registrations.registrationCode,
        status: registrations.status,
        registeredAt: registrations.registeredAt,
        student: {
          id: user.id,
          name: user.name,
          email: user.email,
          studentId: user.studentId,
          department: user.department,
        },
        hasAttended: sql<boolean>`CASE WHEN ${attendance.id} IS NOT NULL THEN true ELSE false END`,
        scannedAt: attendance.scannedAt,
      })
      .from(registrations)
      .innerJoin(user, eq(registrations.userId, user.id))
      .leftJoin(attendance, eq(attendance.registrationId, registrations.id))
      .where(eq(registrations.eventId, eventId))
      .orderBy(desc(registrations.registeredAt));

    return attendees;
  }
}
