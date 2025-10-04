import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { AssignmentDetailResponse } from '../lib/dto';

export const useAssignmentDetail = (assignmentId: string) => {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const response = await apiClient.get<AssignmentDetailResponse>(
        `/assignments/${assignmentId}`
      );

      return response.data;
    },
    enabled: !!assignmentId,
    retry: 1,
  });
};

