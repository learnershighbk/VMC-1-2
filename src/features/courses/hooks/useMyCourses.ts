import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CourseResponse } from '../lib/dto';

export const useMyCourses = () => {
  return useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const response = await apiClient.get<CourseResponse[]>('/courses/my');
      return response.data;
    },
  });
};

