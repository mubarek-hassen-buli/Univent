import { useQuery } from '@tanstack/react-query';
import { apiClient, type ApiSuccessResponse } from '@/lib/api/client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  createdAt: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<Category[]>>('/categories');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
