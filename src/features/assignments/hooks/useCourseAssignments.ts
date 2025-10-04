import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { AssignmentDetailResponse } from '../lib/dto';

export const useCourseAssignments = (courseId: string) => {
  return useQuery({
    queryKey: ['assignments', 'course', courseId],
    queryFn: async () => {
      const response = await apiClient.get<AssignmentDetailResponse[]>(
        `/assignments/course/${courseId}`
      );
      return response.data;
    },
    enabled: !!courseId,
  });
};

