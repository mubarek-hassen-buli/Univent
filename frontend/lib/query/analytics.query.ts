import { useQuery } from '@tanstack/react-query';
import { apiClient, type ApiSuccessResponse } from '@/lib/api/client';

export interface OrganizerAnalyticsData {
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
    startDate: string;
    capacity: number;
    registeredCount: number;
    attendedCount: number;
    attendanceRate: number;
    category: string;
  }>;
}

export interface AdminAnalyticsData {
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
      createdAt: string;
      organizerName: string;
    }>;
    latestCertificates: Array<{
      certificateCode: string;
      issuedAt: string;
      studentName: string;
      eventTitle: string;
    }>;
  };
}

export function useOrganizerAnalytics() {
  return useQuery({
    queryKey: ['organizer-analytics'],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccessResponse<OrganizerAnalyticsData>
      >('/analytics/organizer');
      return response.data.data;
    },
  });
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccessResponse<AdminAnalyticsData>
      >('/analytics/admin');
      return response.data.data;
    },
  });
}
