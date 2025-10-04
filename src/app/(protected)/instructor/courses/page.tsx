'use client';

import { useState } from 'react';
import { useMyCourses } from '@/features/courses/hooks/useMyCourses';
import { usePublishCourse } from '@/features/courses/hooks/usePublishCourse';
import { CourseCard } from '@/features/courses/components/course-card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { SuccessDialog } from '@/components/ui/success-dialog';
import { extractApiErrorMessage } from '@/lib/remote/api-client';

export default function InstructorCoursesPage() {
  const router = useRouter();
  const { data: courses, isLoading, error } = useMyCourses();
  const [publishingCourseId, setPublishingCourseId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const publishCourseMutation = usePublishCourse(publishingCourseId || '');

  const handlePublish = async (courseId: string) => {
    setPublishingCourseId(courseId);
    try {
      await publishCourseMutation.mutateAsync();
      setShowSuccess(true);
      setPublishingCourseId(null);
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err, '코스 게시에 실패했습니다.'));
      setShowError(true);
      setPublishingCourseId(null);
    }
  };

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
        <h1 className="text-3xl font-bold">내 코스</h1>
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
              onPublish={handlePublish}
              isPublishing={publishingCourseId === course.id}
              showActions={true}
            />
          ))}
        </div>
      )}

      <SuccessDialog
        open={showSuccess}
        title="코스 게시 완료"
        message="코스가 성공적으로 게시되었습니다. 이제 학습자들이 코스를 볼 수 있습니다."
        onClose={() => setShowSuccess(false)}
      />

      <ErrorDialog
        open={showError}
        title="코스 게시 실패"
        message={errorMessage}
        onClose={() => setShowError(false)}
      />
    </div>
  );
}

