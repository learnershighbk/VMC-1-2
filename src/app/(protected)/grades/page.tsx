'use client';

import { useMyGrades } from '@/features/submissions/hooks/useMyGrades';
import { CourseGradeSummaryCard } from '@/features/submissions/components/grades/course-grade-summary';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { extractApiErrorMessage } from '@/lib/remote/api-client';
import { Loader2, GraduationCap } from 'lucide-react';

export default function GradesPage() {
  const { data, isLoading, error } = useMyGrades();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDialog
        open={true}
        onClose={() => {
          window.location.href = '/dashboard';
        }}
        title="성적 조회 실패"
        message={extractApiErrorMessage(error, '성적을 불러올 수 없습니다.')}
      />
    );
  }

  const courses = data?.courses || [];

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GraduationCap className="h-8 w-8" />
          내 성적
        </h1>
        <p className="text-muted-foreground">
          수강 중인 코스의 과제 성적과 피드백을 확인하세요.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <GraduationCap className="h-16 w-16 text-muted-foreground" />
          <p className="text-xl font-medium text-muted-foreground">
            아직 수강 중인 코스가 없습니다
          </p>
          <p className="text-sm text-muted-foreground">
            코스를 수강신청하고 과제를 제출해보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {courses.map((course) => (
            <CourseGradeSummaryCard key={course.courseId} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

