import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type ApiSuccessResponse } from '@/lib/api/client';

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  isOnline: boolean;
  meetingLink?: string | null;
  startDate: string;
  endDate: string;
  capacity: number;
  registeredCount: number;
  remainingSeats: number;
  isSoldOut: boolean;
  bannerUrl?: string | null;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
  } | null;
  organizer: {
    id: string;
    name: string;
    image?: string | null;
    department?: string | null;
    email?: string;
  };
}

export interface EventsResponse {
  data: EventItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryEventsParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isOnline?: boolean;
  status?: string;
}

export interface CreateEventInput {
  title: string;
  description: string;
  categoryId?: string;
  location: string;
  isOnline?: boolean;
  meetingLink?: string;
  startDate: string;
  endDate: string;
  capacity: number;
  bannerUrl?: string;
}

export function useEvents(params?: QueryEventsParams) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<EventsResponse>>('/events', {
        params: {
          ...params,
          isOnline: params?.isOnline !== undefined ? String(params.isOnline) : undefined,
        },
      });
      return response.data.data;
    },
  });
}

export function useMyEvents(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['my-events', params],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<EventsResponse>>(
        '/events/organizer/my-events',
        { params },
      );
      return response.data.data;
    },
  });
}

export function useEvent(slug: string) {
  return useQuery({
    queryKey: ['event', slug],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<EventItem>>(
        `/events/${slug}`,
      );
      return response.data.data;
    },
    enabled: !!slug,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      const response = await apiClient.post<ApiSuccessResponse<EventItem>>(
        '/events',
        input,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiClient.delete(`/events/${eventId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
}

export function useAdminEvents(params?: QueryEventsParams) {
  return useQuery({
    queryKey: ['admin-events', params],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<EventsResponse>>(
        '/events/admin/all-events',
        { params },
      );
      return response.data.data;
    },
  });
}

export function useUpdateEventStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      const response = await apiClient.patch(`/events/${eventId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
}

