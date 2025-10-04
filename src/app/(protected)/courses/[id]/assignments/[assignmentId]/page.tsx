'use client';

import { use } from 'react';
import { useAssignmentDetail } from '@/features/assignments/hooks/useAssignmentDetail';
import { AssignmentDetailCard } from '@/features/assignments/components/assignment-detail-card';
import { SubmissionInfo } from '@/features/assignments/components/submission-info';
import { SubmissionForm } from '@/features/submissions/components/submission-form';
import { SubmissionDisplay } from '@/features/submissions/components/submission-display';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { extractApiErrorMessage } from '@/lib/remote/api-client';
import { Loader2 } from 'lucide-react';

interface AssignmentDetailPageProps {
  params: Promise<{
    id: string;
    assignmentId: string;
  }>;
}

export default function AssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  const resolvedParams = use(params);
  const { data: assignment, isLoading, error } = useAssignmentDetail(
    resolvedParams.assignmentId
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDialog
        open={true}
        title="과제 조회 실패"
        message={extractApiErrorMessage(error, '과제를 불러올 수 없습니다.')}
        onClose={() => window.history.back()}
      />
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">과제를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const showSubmissionForm = 
    assignment.status === 'published' && 
    (!assignment.submission || 
     assignment.allowResubmission || 
     assignment.submission.status === 'resubmission_required');

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <AssignmentDetailCard assignment={assignment} />
      
      {assignment.submission && (
        <SubmissionDisplay 
          submission={assignment.submission}
          allowResubmission={assignment.allowResubmission}
        />
      )}

      {showSubmissionForm && (
        <SubmissionForm 
          assignmentId={assignment.id}
          assignment={assignment}
        />
      )}
    </div>
  );
}

