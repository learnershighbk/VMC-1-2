'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { SuccessDialog } from '@/components/ui/success-dialog';
import { useEnrollment } from '../hooks/useEnrollment';
import { CheckCircle, Loader2 } from 'lucide-react';

interface EnrollButtonProps {
  courseId: string;
  isEnrolled: boolean;
  courseTitle: string;
}

export const EnrollButton = ({
  courseId,
  isEnrolled,
  courseTitle,
}: EnrollButtonProps) => {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const enrollMutation = useEnrollment();

  const handleEnroll = async () => {
    try {
      await enrollMutation.mutateAsync({ courseId });
      setShowSuccess(true);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('수강신청 중 오류가 발생했습니다.');
      }
    }
  };

  if (isEnrolled) {
    return (
      <Button disabled className="w-full" size="lg">
        <CheckCircle className="w-4 h-4 mr-2" />
        수강 중
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleEnroll}
        disabled={enrollMutation.isPending}
        className="w-full"
        size="lg"
      >
        {enrollMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            처리 중...
          </>
        ) : (
          '수강신청'
        )}
      </Button>

      <ErrorDialog
        open={!!errorMessage}
        onClose={() => setErrorMessage('')}
        title="수강신청 실패"
        message={errorMessage}
      />

      <SuccessDialog
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="수강신청 완료"
        message={`"${courseTitle}" 코스 수강신청이 완료되었습니다.`}
      />
    </>
  );
};

