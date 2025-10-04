import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { MyEnrollmentResponse } from '../lib/dto';

export const useMyEnrollments = () => {
  return useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const response = await apiClient.get<MyEnrollmentResponse[]>(
        '/enrollments'
      );

      return response.data;
    },
  });
};


