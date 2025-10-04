'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { ReviewSubmissionInput, AssignmentSubmissionItem } from '../lib/dto';

export const useReviewSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      input,
    }: {
      submissionId: string;
      input: ReviewSubmissionInput;
    }) => {
      const response = await apiClient.patch(
        `/submissions/${submissionId}`,
        input
      );
      return response.data as AssignmentSubmissionItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['assignment-submissions', data.assignmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['assignment', data.assignmentId],
      });
    },
  });
};

