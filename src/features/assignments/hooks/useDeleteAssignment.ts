import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

export const useDeleteAssignment = (assignmentId: string, courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/assignments/${assignmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments', courseId] });
      queryClient.removeQueries({ queryKey: ['assignment', assignmentId] });
    },
  });
};

