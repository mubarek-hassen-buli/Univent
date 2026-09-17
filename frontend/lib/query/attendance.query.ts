import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type ApiSuccessResponse } from '@/lib/api/client';

export interface AttendanceStatsResponse {
  eventId: string;
  eventTitle: string;
  capacity: number;
  registeredCount: number;
  checkedInCount: number;
  attendanceRate: number;
  recentCheckIns: Array<{
    attendanceId: string;
    registrationCode: string;
    scannedAt: string;
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
  registeredAt: string;
  hasAttended: boolean;
  scannedAt: string | null;
  student: {
    id: string;
    name: string;
    email: string;
    studentId: string | null;
    department: string | null;
  };
}

export interface ScanResultResponse {
  attendance: {
    id: string;
    registrationId: string;
    registrationCode: string;
    scannedAt: string;
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

export function useAttendanceStats(eventId: string) {
  return useQuery({
    queryKey: ['attendance-stats', eventId],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<AttendanceStatsResponse>>(
        `/attendance/event/${eventId}/stats`,
      );
      return response.data.data;
    },
    enabled: !!eventId,
    refetchInterval: 15 * 1000, // Background refresh every 15s
  });
}

export function useEventRoster(eventId: string) {
  return useQuery({
    queryKey: ['event-roster', eventId],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<AttendeeRosterItem[]>>(
        `/attendance/event/${eventId}/roster`,
      );
      return response.data.data;
    },
    enabled: !!eventId,
  });
}

export function useScanTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      eventId: string;
      qrHash?: string;
      registrationCode?: string;
    }) => {
      const response = await apiClient.post<ApiSuccessResponse<ScanResultResponse>>(
        '/attendance/scan',
        payload,
      );
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['attendance-stats', variables.eventId],
      });
      queryClient.invalidateQueries({
        queryKey: ['event-roster', variables.eventId],
      });
    },
  });
}
