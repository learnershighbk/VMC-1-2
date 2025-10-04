import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { SubmitAssignmentRequest, SubmissionResult } from '../lib/dto';

export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SubmitAssignmentRequest) => {
      const response = await apiClient.post<SubmissionResult>(
        '/submissions',
        request
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['assignment', variables.assignmentId] 
      });
    },
  });
};

