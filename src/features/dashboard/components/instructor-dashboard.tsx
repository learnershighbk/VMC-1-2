'use client';

import { useMyCourses } from '@/features/courses/hooks/useMyCourses';
import { CourseCard } from '@/features/courses/components/course-card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { extractApiErrorMessage } from '@/lib/remote/api-client';

export const InstructorDashboard = () => {
  const router = useRouter();
  const { data: courses, isLoading, error } = useMyCourses();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDialog
        open={true}
        title="코스 목록 조회 실패"
        message={extractApiErrorMessage(error, '코스 목록을 불러올 수 없습니다.')}
        onClose={() => router.push('/dashboard')}
      />
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instructor 대시보드</h1>
          <p className="text-muted-foreground mt-2">
            내가 생성한 코스를 관리하고 과제를 추가할 수 있습니다
          </p>
        </div>
        <Button onClick={() => router.push('/instructor/courses/new')}>
          <Plus className="w-4 h-4 mr-2" />
          새 코스 생성
        </Button>
      </div>

      {courses && courses.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">
            아직 생성한 코스가 없습니다
          </p>
          <Button onClick={() => router.push('/instructor/courses/new')}>
            <Plus className="w-4 h-4 mr-2" />
            첫 코스 만들기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses?.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => router.push(`/instructor/courses/${course.id}/edit`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

