'use client';

import { useMyEnrollments } from '@/features/enrollments/hooks/useMyEnrollments';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { extractApiErrorMessage } from '@/lib/remote/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/date';

export const LearnerDashboard = () => {
  const router = useRouter();
  const { data: enrollments, isLoading, error } = useMyEnrollments();

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
        title="수강 목록 조회 실패"
        message={extractApiErrorMessage(error, '수강 목록을 불러올 수 없습니다.')}
        onClose={() => router.push('/dashboard')}
      />
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Learner 대시보드</h1>
          <p className="text-muted-foreground mt-2">
            수강 중인 코스를 확인하고 과제를 제출하세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/grades')}>
            <GraduationCap className="w-4 h-4 mr-2" />
            내 성적
          </Button>
          <Button onClick={() => router.push('/courses')}>
            <BookOpen className="w-4 h-4 mr-2" />
            코스 탐색
          </Button>
        </div>
      </div>

      {enrollments && enrollments.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            아직 수강 중인 코스가 없습니다
          </p>
          <Button onClick={() => router.push('/courses')}>
            <BookOpen className="w-4 h-4 mr-2" />
            코스 둘러보기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments?.map((enrollment) => (
            <Card
              key={enrollment.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/courses/${enrollment.courseId}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl line-clamp-2">
                    {enrollment.courseTitle}
                  </CardTitle>
                  <Badge variant="secondary">{enrollment.difficulty}</Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {enrollment.courseDescription}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>{enrollment.instructorName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{enrollment.category}</Badge>
                    <span className="text-xs">
                      수강 시작: {formatDate(enrollment.enrolledAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

