import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { eq, and, desc, count } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { PusherService } from '../../common/pusher/pusher.service.js';
import { RegistrationsService } from '../registrations/registrations.service.js';
import { events } from '../../database/schema/events.schema.js';
import { registrations } from '../../database/schema/registrations.schema.js';
import { attendance } from '../../database/schema/attendance.schema.js';
import type { ScanTicketDto } from './dto/scan-ticket.dto.js';

export interface AttendanceResult {
  attendance: {
    id: string;
    registrationId: string;
    registrationCode: string;
    scannedAt: Date;
  };
  student: {
    id: string;
    name: string;
    email: string;
    studentId: string | null;
    department: string | null;
  };
  stats: {
    checkedInCount: number;
    registeredCount: number;
    capacity: number;
    attendanceRate: number;
  };
}

export interface AttendanceStats {
  eventId: string;
  eventTitle: string;
  capacity: number;
  registeredCount: number;
  checkedInCount: number;
  attendanceRate: number;
  recentCheckIns: Array<{
    attendanceId: string;
    registrationCode: string;
    scannedAt: Date;
    student: {
      name: string;
      studentId: string | null;
      department: string | null;
    };
  }>;
}

export interface AttendeeRosterItem {
  registrationId: string;
  registrationCode: string;
  status: string;
  registeredAt: Date;
  hasAttended: boolean;
  scannedAt: Date | null;
  student: {
    id: string;
    name: string;
    email: string;
    studentId: string | null;
    department: string | null;
  };
}

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly registrationsService: RegistrationsService,
    private readonly pusherService: PusherService,
  ) {}

  /**
   * Scans a QR token or manual registration code to record student check-in
   */
  async scanAndCheckIn(
    dto: ScanTicketDto,
    scannerUser: { id: string; role: string },
  ): Promise<AttendanceResult> {
    const db = this.databaseService.db;

    // 1. Validate Event exists
    const event = await db.query.events.findFirst({
      where: eq(events.id, dto.eventId),
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // 2. Authorize scanner: Organizer must own event, or user is admin
    if (scannerUser.role !== 'admin' && event.organizerId !== scannerUser.id) {
      throw new ForbiddenException(
        'You are not authorized to check in attendees for this event',
      );
    }

    // 3. Event state check
    if (event.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot check in attendees for a cancelled event',
      );
    }

    // 4. Resolve Registration
    let registrationIdToLookup: string | null = null;
    let manualCodeToLookup: string | null = null;

    if (dto.qrHash) {
      const qrVerification = this.registrationsService.verifyQrHash(dto.qrHash);
      if (!qrVerification.valid || !qrVerification.registrationId) {
        throw new BadRequestException('Invalid or counterfeit QR code signature');
      }

      // Ensure ticket belongs to the target event
      if (qrVerification.eventId !== dto.eventId) {
        throw new BadRequestException(
          'This ticket pass belongs to a different university event',
        );
      }

      registrationIdToLookup = qrVerification.registrationId;
    } else if (dto.registrationCode) {
      manualCodeToLookup = dto.registrationCode.trim().toUpperCase();
    }

    const registration = await db.query.registrations.findFirst({
      where: registrationIdToLookup
        ? eq(registrations.id, registrationIdToLookup)
        : and(
            eq(registrations.registrationCode, manualCodeToLookup!),
            eq(registrations.eventId, dto.eventId),
          ),
      with: {
        user: true,
        attendance: true,
      },
    });

    if (!registration) {
      throw new NotFoundException(
        'Valid registration not found for this event',
      );
    }

    // Verify event matches if lookup was by registration ID
    if (registration.eventId !== event.id) {
      throw new BadRequestException(
        'This ticket pass belongs to a different university event',
      );
    }

    // 5. Verify Registration Status
    if (registration.status === 'CANCELLED') {
      throw new BadRequestException('This ticket registration has been cancelled');
    }

    // 6. Duplicate Attendance Prevention
    if (registration.attendance) {
      const formattedTime = new Date(
        registration.attendance.scannedAt,
      ).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
      throw new ConflictException(
        `Ticket already scanned! Attendee checked in at ${formattedTime}`,
      );
    }

    // 7. Atomic Insert into attendance table
    const [newAttendance] = await db
      .insert(attendance)
      .values({
        registrationId: registration.id,
        eventId: event.id,
        scannedBy: scannerUser.id,
      })
      .returning();

    // 8. Compute updated event check-in metrics
    const [statsCount] = await db
      .select({ val: count() })
      .from(attendance)
      .where(eq(attendance.eventId, event.id));

    const checkedInCount = Number(statsCount?.val || 0);
    const attendanceRate = Math.round(
      (checkedInCount / Math.max(event.registeredCount, 1)) * 100,
    );

    const resultPayload: AttendanceResult = {
      attendance: {
        id: newAttendance.id,
        registrationId: registration.id,
        registrationCode: registration.registrationCode,
        scannedAt: newAttendance.scannedAt,
      },
      student: {
        id: registration.user.id,
        name: registration.user.name,
        email: registration.user.email,
        studentId: registration.user.studentId,
        department: registration.user.department,
      },
      stats: {
        checkedInCount,
        registeredCount: event.registeredCount,
        capacity: event.capacity,
        attendanceRate,
      },
    };

    // 9. Real-time Pusher Broadcast
    await this.pusherService.trigger(
      `event-${event.id}`,
      'attendance:checked-in',
      resultPayload,
    );

    this.logger.log(
      `Attendee ${registration.user.name} checked in for event "${event.title}" [Code: ${registration.registrationCode}]`,
    );

    return resultPayload;
  }

  /**
   * Retrieves real-time attendance statistics and recent check-ins for an event
   */
  async getEventAttendanceStats(
    eventId: string,
    scannerUser: { id: string; role: string },
  ): Promise<AttendanceStats> {
    const db = this.databaseService.db;

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (scannerUser.role !== 'admin' && event.organizerId !== scannerUser.id) {
      throw new ForbiddenException('You do not have access to this event');
    }

    const [statsCount] = await db
      .select({ val: count() })
      .from(attendance)
      .where(eq(attendance.eventId, event.id));

    const checkedInCount = Number(statsCount?.val || 0);
    const attendanceRate = Math.round(
      (checkedInCount / Math.max(event.registeredCount, 1)) * 100,
    );

    const recentRecords = await db.query.attendance.findMany({
      where: eq(attendance.eventId, event.id),
      orderBy: [desc(attendance.scannedAt)],
      limit: 15,
      with: {
        registration: {
          with: {
            user: true,
          },
        },
      },
    });

    const recentCheckIns = recentRecords.map((rec) => ({
      attendanceId: rec.id,
      registrationCode: rec.registration.registrationCode,
      scannedAt: rec.scannedAt,
      student: {
        name: rec.registration.user.name,
        studentId: rec.registration.user.studentId,
        department: rec.registration.user.department,
      },
    }));

    return {
      eventId: event.id,
      eventTitle: event.title,
      capacity: event.capacity,
      registeredCount: event.registeredCount,
      checkedInCount,
      attendanceRate,
      recentCheckIns,
    };
  }

  /**
   * Retrieves the full attendee roster for an event with attendance status
   */
  async getEventRoster(
    eventId: string,
    scannerUser: { id: string; role: string },
  ): Promise<AttendeeRosterItem[]> {
    const db = this.databaseService.db;

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (scannerUser.role !== 'admin' && event.organizerId !== scannerUser.id) {
      throw new ForbiddenException('You do not have access to this event');
    }

    const records = await db.query.registrations.findMany({
      where: eq(registrations.eventId, event.id),
      with: {
        user: true,
        attendance: true,
      },
      orderBy: [desc(registrations.registeredAt)],
    });

    return records.map((r) => ({
      registrationId: r.id,
      registrationCode: r.registrationCode,
      status: r.status,
      registeredAt: r.registeredAt,
      hasAttended: !!r.attendance,
      scannedAt: r.attendance ? r.attendance.scannedAt : null,
      student: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        studentId: r.user.studentId,
        department: r.user.department,
      },
    }));
  }
}
