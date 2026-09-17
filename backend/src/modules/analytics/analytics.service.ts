import { Injectable } from '@nestjs/common';
import { eq, and, desc, count, sql, gte } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { events } from '../../database/schema/events.schema.js';
import { user } from '../../database/schema/auth.schema.js';
import { registrations } from '../../database/schema/registrations.schema.js';
import { attendance } from '../../database/schema/attendance.schema.js';
import { certificates } from '../../database/schema/certificates.schema.js';
import { categories } from '../../database/schema/categories.schema.js';

export interface ActivityTimelinePoint {
  date: string;
  registrations: number;
  attendance: number;
}

function build30DayTimeline(
  regRows: Array<{ date: string; count: number | string }>,
  attRows: Array<{ date: string; count: number | string }>,
): ActivityTimelinePoint[] {
  const regMap = new Map<string, number>();
  for (const row of regRows) {
    regMap.set(row.date, Number(row.count || 0));
  }

  const attMap = new Map<string, number>();
  for (const row of attRows) {
    attMap.set(row.date, Number(row.count || 0));
  }

  const timeline: ActivityTimelinePoint[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    timeline.push({
      date: dateStr,
      registrations: regMap.get(dateStr) || 0,
      attendance: attMap.get(dateStr) || 0,
    });
  }

  return timeline;
}

export interface OrganizerAnalytics {
  totalEvents: number;
  totalCapacity: number;
  totalRegistrations: number;
  totalAttended: number;
  overallAttendanceRate: number;
  overallOccupancyRate: number;
  statusDistribution: {
    published: number;
    draft: number;
    completed: number;
    cancelled: number;
  };
  categoryDistribution: Array<{
    name: string;
    eventCount: number;
  }>;
  timeline: ActivityTimelinePoint[];
  eventPerformance: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    startDate: Date;
    capacity: number;
    registeredCount: number;
    attendedCount: number;
    attendanceRate: number;
    category: string;
  }>;
}

export interface AdminAnalytics {
  overview: {
    totalUsers: number;
    totalStudents: number;
    totalOrganizers: number;
    totalAdmins: number;
    totalEvents: number;
    publishedEvents: number;
    totalRegistrations: number;
    totalAttendance: number;
    totalCertificates: number;
    platformAttendanceRate: number;
  };
  eventsByStatus: {
    published: number;
    draft: number;
    completed: number;
    cancelled: number;
  };
  categoryDistribution: Array<{
    id: string;
    name: string;
    eventCount: number;
  }>;
  timeline: ActivityTimelinePoint[];
  recentActivity: {
    latestEvents: Array<{
      id: string;
      title: string;
      slug: string;
      status: string;
      createdAt: Date;
      organizerName: string;
    }>;
    latestCertificates: Array<{
      certificateCode: string;
      issuedAt: Date;
      studentName: string;
      eventTitle: string;
    }>;
  };
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Retrieves comprehensive metrics and event breakdown for an organizer
   */
  async getOrganizerAnalytics(organizerId: string): Promise<OrganizerAnalytics> {
    const db = this.databaseService.db;

    // 1. Fetch organizer's events with relations
    const orgEvents = await db.query.events.findMany({
      where: eq(events.organizerId, organizerId),
      orderBy: [desc(events.createdAt)],
      with: {
        category: true,
        attendanceRecords: true,
      },
    });

    const totalEvents = orgEvents.length;
    let totalCapacity = 0;
    let totalRegistrations = 0;
    let totalAttended = 0;

    const eventPerformance = orgEvents.map((evt) => {
      totalCapacity += evt.capacity;
      totalRegistrations += evt.registeredCount;
      const attendedCount = evt.attendanceRecords.length;
      totalAttended += attendedCount;

      const attendanceRate = Math.round(
        (attendedCount / Math.max(evt.registeredCount, 1)) * 100,
      );

      return {
        id: evt.id,
        title: evt.title,
        slug: evt.slug,
        status: evt.status,
        startDate: evt.startDate,
        capacity: evt.capacity,
        registeredCount: evt.registeredCount,
        attendedCount,
        attendanceRate,
        category: evt.category?.name || 'General',
      };
    });

    const overallAttendanceRate = Math.round(
      (totalAttended / Math.max(totalRegistrations, 1)) * 100,
    );

    const overallOccupancyRate = Math.round(
      (totalRegistrations / Math.max(totalCapacity, 1)) * 100,
    );

    // 2. Status distribution
    const statusDistribution = {
      published: orgEvents.filter((e) => e.status === 'PUBLISHED').length,
      draft: orgEvents.filter((e) => e.status === 'DRAFT').length,
      completed: orgEvents.filter((e) => e.status === 'COMPLETED').length,
      cancelled: orgEvents.filter((e) => e.status === 'CANCELLED').length,
    };

    // 3. Category distribution
    const categoryCountMap = new Map<string, number>();
    for (const evt of orgEvents) {
      const catName = evt.category?.name || 'General';
      categoryCountMap.set(catName, (categoryCountMap.get(catName) || 0) + 1);
    }
    const categoryDistribution = Array.from(categoryCountMap.entries()).map(
      ([name, eventCount]) => ({
        name,
        eventCount,
      }),
    );

    // 4. 30-day activity timeline for organizer
    const orgRegByDate = await db
      .select({
        date: sql<string>`to_char(${registrations.registeredAt}, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .where(
        and(
          eq(events.organizerId, organizerId),
          gte(registrations.registeredAt, sql`NOW() - INTERVAL '30 days'`),
        ),
      )
      .groupBy(sql`to_char(${registrations.registeredAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${registrations.registeredAt}, 'YYYY-MM-DD')`);

    const orgAttByDate = await db
      .select({
        date: sql<string>`to_char(${attendance.scannedAt}, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(attendance)
      .innerJoin(events, eq(attendance.eventId, events.id))
      .where(
        and(
          eq(events.organizerId, organizerId),
          gte(attendance.scannedAt, sql`NOW() - INTERVAL '30 days'`),
        ),
      )
      .groupBy(sql`to_char(${attendance.scannedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${attendance.scannedAt}, 'YYYY-MM-DD')`);

    const timeline = build30DayTimeline(orgRegByDate, orgAttByDate);

    return {
      totalEvents,
      totalCapacity,
      totalRegistrations,
      totalAttended,
      overallAttendanceRate,
      overallOccupancyRate,
      statusDistribution,
      categoryDistribution,
      timeline,
      eventPerformance,
    };
  }

  /**
   * Retrieves platform-wide analytics for system administrators
   */
  async getAdminAnalytics(): Promise<AdminAnalytics> {
    const db = this.databaseService.db;

    // 1. User counts
    const allUsers = await db.query.user.findMany();
    const totalUsers = allUsers.length;
    const totalStudents = allUsers.filter((u) => u.role === 'student').length;
    const totalOrganizers = allUsers.filter((u) => u.role === 'organizer').length;
    const totalAdmins = allUsers.filter((u) => u.role === 'admin').length;

    // 2. Event counts
    const allEvents = await db.query.events.findMany({
      with: {
        organizer: true,
      },
      orderBy: [desc(events.createdAt)],
    });

    const totalEvents = allEvents.length;
    const publishedEvents = allEvents.filter((e) => e.status === 'PUBLISHED').length;
    const draftEvents = allEvents.filter((e) => e.status === 'DRAFT').length;
    const completedEvents = allEvents.filter((e) => e.status === 'COMPLETED').length;
    const cancelledEvents = allEvents.filter((e) => e.status === 'CANCELLED').length;

    // 3. Registrations, Attendance & Certificates totals
    const [regCount] = await db.select({ val: count() }).from(registrations);
    const totalRegistrations = Number(regCount?.val || 0);

    const [attCount] = await db.select({ val: count() }).from(attendance);
    const totalAttendance = Number(attCount?.val || 0);

    const [certCount] = await db.select({ val: count() }).from(certificates);
    const totalCertificates = Number(certCount?.val || 0);

    const platformAttendanceRate = Math.round(
      (totalAttendance / Math.max(totalRegistrations, 1)) * 100,
    );

    // 4. Category distribution
    const allCategories = await db.query.categories.findMany({
      with: {
        events: true,
      },
    });

    const categoryDistribution = allCategories.map((c) => ({
      id: c.id,
      name: c.name,
      eventCount: c.events.length,
    }));

    // 5. 30-day activity timeline platform-wide
    const adminRegByDate = await db
      .select({
        date: sql<string>`to_char(${registrations.registeredAt}, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(registrations)
      .where(gte(registrations.registeredAt, sql`NOW() - INTERVAL '30 days'`))
      .groupBy(sql`to_char(${registrations.registeredAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${registrations.registeredAt}, 'YYYY-MM-DD')`);

    const adminAttByDate = await db
      .select({
        date: sql<string>`to_char(${attendance.scannedAt}, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(attendance)
      .where(gte(attendance.scannedAt, sql`NOW() - INTERVAL '30 days'`))
      .groupBy(sql`to_char(${attendance.scannedAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${attendance.scannedAt}, 'YYYY-MM-DD')`);

    const timeline = build30DayTimeline(adminRegByDate, adminAttByDate);

    // 6. Recent Activity
    const latestEvents = allEvents.slice(0, 5).map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      status: e.status,
      createdAt: e.createdAt,
      organizerName: e.organizer.name,
    }));

    const recentCerts = await db.query.certificates.findMany({
      orderBy: [desc(certificates.issuedAt)],
      limit: 5,
      with: {
        user: true,
        event: true,
      },
    });

    const latestCertificates = recentCerts.map((c) => ({
      certificateCode: c.certificateCode,
      issuedAt: c.issuedAt,
      studentName: c.user.name,
      eventTitle: c.event.title,
    }));

    return {
      overview: {
        totalUsers,
        totalStudents,
        totalOrganizers,
        totalAdmins,
        totalEvents,
        publishedEvents,
        totalRegistrations,
        totalAttendance,
        totalCertificates,
        platformAttendanceRate,
      },
      eventsByStatus: {
        published: publishedEvents,
        draft: draftEvents,
        completed: completedEvents,
        cancelled: cancelledEvents,
      },
      categoryDistribution,
      timeline,
      recentActivity: {
        latestEvents,
        latestCertificates,
      },
    };
  }
}
