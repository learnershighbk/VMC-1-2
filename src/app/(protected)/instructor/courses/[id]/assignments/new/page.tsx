'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AssignmentForm } from '@/features/assignments/components/assignment-form';
import { useCreateAssignment } from '@/features/assignments/hooks/useCreateAssignment';
import type { CreateAssignmentInput } from '@/features/assignments/lib/dto';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { SuccessDialog } from '@/components/ui/success-dialog';
import { extractApiErrorMessage } from '@/lib/remote/api-client';

interface NewAssignmentPageProps {
  params: Promise<{ id: string }>;
}

export default function NewAssignmentPage({ params }: NewAssignmentPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const createAssignment = useCreateAssignment();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (data: CreateAssignmentInput) => {
    try {
      await createAssignment.mutateAsync(data);
      setShowSuccess(true);
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, '과제 생성에 실패했습니다.'));
      setShowError(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.push(`/instructor/courses/${resolvedParams.id}/edit`);
  };

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">새 과제 생성</h1>
        <p className="text-muted-foreground mt-2">
          코스에 새로운 과제를 추가합니다
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <AssignmentForm
          mode="create"
          courseId={resolvedParams.id}
          onSubmit={handleSubmit}
          isLoading={createAssignment.isPending}
        />
      </div>

      <SuccessDialog
        open={showSuccess}
        title="과제 생성 완료"
        message="과제가 성공적으로 생성되었습니다. 생성된 과제는 과제 관리 메뉴에서 게시할 수 있습니다."
        onClose={handleSuccessClose}
      />

      <ErrorDialog
        open={showError}
        title="과제 생성 실패"
        message={errorMessage}
        onClose={() => setShowError(false)}
      />
    </div>
  );
}

