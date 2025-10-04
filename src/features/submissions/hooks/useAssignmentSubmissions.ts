'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { AssignmentSubmissionListResponse } from '../lib/dto';

export const useAssignmentSubmissions = (assignmentId: string) => {
  return useQuery({
    queryKey: ['assignment-submissions', assignmentId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/submissions/assignment/${assignmentId}`
      );
      return response.data as AssignmentSubmissionListResponse;
    },
    enabled: !!assignmentId,
  });
};

