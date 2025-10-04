import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { AssignmentDetailResponse } from '../lib/dto';

export const useCourseAssignmentsForLearner = (courseId: string) => {
  return useQuery({
    queryKey: ['assignments', 'course', courseId, 'learner'],
    queryFn: async () => {
      const response = await apiClient.get<AssignmentDetailResponse[]>(
        `/assignments/course/${courseId}/learner`
      );
      return response.data;
    },
    enabled: !!courseId,
  });
};

