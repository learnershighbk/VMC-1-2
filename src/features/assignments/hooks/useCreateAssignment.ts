import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CreateAssignmentInput, AssignmentDetailResponse } from '../lib/dto';

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAssignmentInput) => {
      const response = await apiClient.post<AssignmentDetailResponse>('/assignments', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments', variables.courseId] });
    },
  });
};

