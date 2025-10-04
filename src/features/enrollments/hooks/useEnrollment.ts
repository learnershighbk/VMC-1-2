import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { EnrollmentRequest, EnrollmentResponse } from '../lib/dto';

export const useEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: EnrollmentRequest) => {
      const response = await apiClient.post<EnrollmentResponse>(
        '/enrollments',
        request
      );

      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
};


