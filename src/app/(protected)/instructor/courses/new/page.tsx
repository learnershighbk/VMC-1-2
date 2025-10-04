'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CourseForm } from '@/features/courses/components/course-form';
import { useCreateCourse } from '@/features/courses/hooks/useCreateCourse';
import type { CreateCourseInput } from '@/features/courses/lib/dto';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { SuccessDialog } from '@/components/ui/success-dialog';
import { extractApiErrorMessage } from '@/lib/remote/api-client';

export default function NewCoursePage() {
  const router = useRouter();
  const createCourse = useCreateCourse();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (data: CreateCourseInput) => {
    try {
      const result = await createCourse.mutateAsync(data);
      setShowSuccess(true);
      setTimeout(() => {
        router.push(`/instructor/courses/${result.id}/edit`);
      }, 1500);
    } catch (error) {
      setErrorMessage(extractApiErrorMessage(error, '코스 생성에 실패했습니다.'));
      setShowError(true);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">새 코스 생성</h1>
        <p className="text-muted-foreground mt-2">
          학습자에게 제공할 코스를 생성합니다
        </p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <CourseForm
          mode="create"
          onSubmit={handleSubmit}
          isLoading={createCourse.isPending}
        />
      </div>

      <SuccessDialog
        open={showSuccess}
        title="코스 생성 완료"
        message="코스가 성공적으로 생성되었습니다. 이제 과제를 추가할 수 있습니다."
        onClose={() => setShowSuccess(false)}
      />

      <ErrorDialog
        open={showError}
        title="코스 생성 실패"
        message={errorMessage}
        onClose={() => setShowError(false)}
      />
    </div>
  );
}

