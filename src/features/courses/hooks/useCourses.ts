import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CourseListQuery, CourseResponse } from '../lib/dto';

export const useCourses = (query: CourseListQuery) => {
  return useQuery({
    queryKey: ['courses', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (query.search) params.append('search', query.search);
      if (query.category) params.append('category', query.category);
      if (query.difficulty) params.append('difficulty', query.difficulty);
      if (query.sort) params.append('sort', query.sort);
      if (query.status) params.append('status', query.status);

      const response = await apiClient.get<CourseResponse[]>(
        `/courses?${params.toString()}`
      );

      return response.data;
    },
  });
};


