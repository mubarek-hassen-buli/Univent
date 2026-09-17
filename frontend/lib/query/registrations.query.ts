import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type ApiSuccessResponse } from '@/lib/api/client';

export interface TicketItem {
  id: string;
  registrationCode: string;
  qrHash: string;
  status: 'CONFIRMED' | 'CANCELLED';
  registeredAt: string;
  hasAttended: boolean;
  attendedAt?: string | null;
  event: {
    id: string;
    title: string;
    slug: string;
    description: string;
    location: string;
    isOnline: boolean;
    meetingLink?: string | null;
    startDate: string;
    endDate: string;
    bannerUrl?: string | null;
    status: string;
  };
  category?: {
    name: string;
    slug: string;
  } | null;
  organizer: {
    name: string;
    department?: string | null;
  };
  student?: {
    id: string;
    name: string;
    email: string;
    studentId?: string | null;
    department?: string | null;
  };
}

export function useMyTickets() {
  return useQuery({
    queryKey: ['my-tickets'],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<TicketItem[]>>(
        '/registrations/my-tickets',
      );
      return response.data.data;
    },
    staleTime: 30 * 1000,
  });
}

export function useTicket(registrationId: string) {
  return useQuery({
    queryKey: ['ticket', registrationId],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<TicketItem>>(
        `/registrations/ticket/${registrationId}`,
      );
      return response.data.data;
    },
    enabled: !!registrationId,
  });
}

export function useRegisterEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiClient.post<
        ApiSuccessResponse<{
          registration: {
            id: string;
            registrationCode: string;
            qrHash: string;
          };
          event: {
            id: string;
            title: string;
            slug: string;
          };
        }>
      >(`/registrations/event/${eventId}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
    },
  });
}

export function useCancelRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registrationId: string) => {
      const response = await apiClient.post<
        ApiSuccessResponse<{ message: string }>
      >(`/registrations/cancel/${registrationId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}
