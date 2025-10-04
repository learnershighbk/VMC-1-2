import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { UpdateAssignmentInput, AssignmentDetailResponse } from '../lib/dto';

export const useUpdateAssignment = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAssignmentInput) => {
      const response = await apiClient.patch<AssignmentDetailResponse>(
        `/assignments/${assignmentId}`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['course-assignments', data.courseId] });
    },
  });
};

