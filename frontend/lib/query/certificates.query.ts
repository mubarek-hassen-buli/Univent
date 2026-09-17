import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type ApiSuccessResponse } from '@/lib/api/client';

export interface StudentCertificateItem {
  id: string;
  certificateCode: string;
  issuedAt: string;
  pdfUrl: string;
  event: {
    id: string;
    title: string;
    slug: string;
    startDate: string;
    endDate: string;
    location: string;
    isOnline: boolean;
    category: string;
  };
  organizer: {
    name: string;
    department: string | null;
  };
}

export interface PublicVerificationData {
  valid: boolean;
  certificateCode: string;
  issuedAt: string;
  student: {
    name: string;
    studentId: string | null;
    department: string | null;
  };
  event: {
    id: string;
    title: string;
    slug: string;
    startDate: string;
    endDate: string;
    location: string;
    isOnline: boolean;
  };
  organizer: {
    name: string;
    department: string | null;
  };
  downloadUrl: string;
}

export function useMyCertificates() {
  return useQuery({
    queryKey: ['my-certificates'],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccessResponse<StudentCertificateItem[]>
      >('/certificates/my-certificates');
      return response.data.data;
    },
  });
}

export function useVerifyCertificate(code: string) {
  return useQuery({
    queryKey: ['verify-certificate', code],
    queryFn: async () => {
      const response = await apiClient.get<
        ApiSuccessResponse<PublicVerificationData>
      >(`/certificates/verify/${code}`);
      return response.data.data;
    },
    enabled: !!code,
    retry: 1,
  });
}

export function useClaimCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiClient.post<
        ApiSuccessResponse<StudentCertificateItem>
      >(`/certificates/claim/${eventId}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-certificates'] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    },
  });
}

export function useBatchIssueCertificates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiClient.post<
        ApiSuccessResponse<{
          issuedCount: number;
          totalEligible: number;
          message?: string;
        }>
      >(`/certificates/event/${eventId}/issue-all`);
      return response.data.data;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-stats', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-roster', eventId] });
    },
  });
}
