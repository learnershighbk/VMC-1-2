'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAssignmentSubmissions } from '@/features/submissions/hooks/useAssignmentSubmissions';
import { AssignmentSubmissionList } from '@/features/submissions/components/assignment-submission-list';
import { SubmissionReviewDialog } from '@/features/submissions/components/submission-review-dialog';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { SuccessDialog } from '@/components/ui/success-dialog';
import type { AssignmentSubmissionItem } from '@/features/submissions/lib/dto';

interface PageProps {
  params: Promise<{
    id: string;
    assignmentId: string;
  }>;
}

export default function InstructorAssignmentSubmissionsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmissionItem | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data,
    isLoading,
    error,
  } = useAssignmentSubmissions(resolvedParams.assignmentId);

  const handleOpenReview = (submission: AssignmentSubmissionItem) => {
    setSelectedSubmission(submission);
    setIsReviewDialogOpen(true);
  };

  const handleReviewSuccess = () => {
    setSuccessMessage('제출물 검토가 완료되었습니다.');
  };

  const handleReviewError = (message: string) => {
    setErrorMessage(message);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDialog
        open={true}
        onClose={() => router.back()}
        title="오류"
        message={error instanceof Error ? error.message : '제출물을 불러오는데 실패했습니다.'}
      />
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로 가기
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">제출물 관리</h1>
          <p className="text-muted-foreground mt-2">
            총 {data.submissions.length}개의 제출물
          </p>
        </div>

        <AssignmentSubmissionList
          assignment={data.assignment as { id: string; title: string; status: 'draft' | 'published' | 'closed'; dueAt: string }}
          submissions={data.submissions}
          onOpenReview={handleOpenReview}
        />

        <SubmissionReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          submission={selectedSubmission}
          onSuccess={handleReviewSuccess}
          onError={handleReviewError}
        />

        <SuccessDialog
          open={!!successMessage}
          onClose={() => setSuccessMessage(null)}
          title="성공"
          message={successMessage || ''}
        />

        <ErrorDialog
          open={!!errorMessage}
          onClose={() => setErrorMessage(null)}
          title="오류"
          message={errorMessage || ''}
        />
      </div>
    </div>
  );
}

