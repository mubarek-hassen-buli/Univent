import { Injectable } from '@nestjs/common';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { events } from '../../database/schema/events.schema.js';
import { user } from '../../database/schema/auth.schema.js';
import { registrations } from '../../database/schema/registrations.schema.js';
import { attendance } from '../../database/schema/attendance.schema.js';
import { certificates } from '../../database/schema/certificates.schema.js';
import { categories } from '../../database/schema/categories.schema.js';

export interface OrganizerAnalytics {
  totalEvents: number;
  totalCapacity: number;
  totalRegistrations: number;
  totalAttended: number;
  overallAttendanceRate: number;
  overallOccupancyRate: number;
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

    return {
      totalEvents,
      totalCapacity,
      totalRegistrations,
      totalAttended,
      overallAttendanceRate,
      overallOccupancyRate,
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

    // 5. Recent Activity
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
      recentActivity: {
        latestEvents,
        latestCertificates,
      },
    };
  }
}
