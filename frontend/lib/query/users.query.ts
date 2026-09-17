import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, type ApiSuccessResponse } from '@/lib/api/client';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'organizer' | 'admin';
  studentId?: string | null;
  department?: string | null;
  createdAt: string;
}

export interface UsersResponse {
  data: UserItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'student' | 'organizer' | 'admin';
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'organizer' | 'admin';
  studentId?: string;
  department?: string;
}

export function useUsers(params?: QueryUsersParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<UsersResponse>>(
        '/users',
        { params },
      );
      return response.data.data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const response = await apiClient.post<ApiSuccessResponse<UserItem>>(
        '/users',
        input,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.delete(`/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'student' | 'organizer' | 'admin' }) => {
      const response = await apiClient.patch(`/users/${userId}/role`, { role });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    },
  });
}
