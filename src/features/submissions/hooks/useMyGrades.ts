import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { MyGradesResponse } from '../lib/dto';

export const useMyGrades = () => {
  return useQuery({
    queryKey: ['submissions', 'my-grades'],
    queryFn: async () => {
      const response = await apiClient.get<MyGradesResponse>(
        '/submissions/my-grades'
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
};

