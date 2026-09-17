import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type ApiSuccessResponse } from '@/lib/api/client';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'REGISTRATION' | 'ATTENDANCE' | 'CERTIFICATE' | 'ANNOUNCEMENT';
  read: boolean;
  link?: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export function useMyNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccessResponse<NotificationsResponse>
      >('/notifications');
      return response.data.data;
    },
    staleTime: 15 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch<
        ApiSuccessResponse<NotificationItem>
      >(`/notifications/${id}/read`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<
        ApiSuccessResponse<{ message: string }>
      >('/notifications/mark-all-read');
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useBroadcastAnnouncement() {
  return useMutation({
    mutationFn: async ({
      eventId,
      title,
      message,
    }: {
      eventId: string;
      title: string;
      message: string;
    }) => {
      const response = await apiClient.post<
        ApiSuccessResponse<{ message: string; attendeeCount: number }>
      >(`/notifications/event/${eventId}/broadcast`, { title, message });
      return response.data.data;
    },
  });
}
