import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { AssignmentDetailResponse } from '../lib/dto';

export const usePublishAssignment = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<AssignmentDetailResponse>(
        `/assignments/${assignmentId}/publish`
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['course-assignments', data.courseId] });
    },
  });
};

