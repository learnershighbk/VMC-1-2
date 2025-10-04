'use client';

import { use } from 'react';
import { useCourseDetail } from '@/features/courses/hooks/useCourseDetail';
import { useCourseAssignmentsForLearner } from '@/features/assignments/hooks/useCourseAssignmentsForLearner';
import { EnrollButton } from '@/features/enrollments/components/enroll-button';
import { AssignmentListCard } from '@/features/assignments/components/assignment-list-card';
import { DueSoonAssignments } from '@/features/assignments/components/due-soon-assignments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Users, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ErrorDialog } from '@/components/ui/error-dialog';

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { id } = use(params);
  const { data: course, isLoading, error } = useCourseDetail(id);
  const { data: assignments, isLoading: assignmentsLoading } = useCourseAssignmentsForLearner(
    course?.isEnrolled ? id : ''
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <ErrorDialog
        open={true}
        onClose={() => {}}
        title="코스를 찾을 수 없습니다"
        message="존재하지 않거나 접근할 수 없는 코스입니다."
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold mb-2">
                {course.title}
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">{course.category}</Badge>
                <Badge variant="outline">{course.difficulty}</Badge>
                <Badge
                  variant={
                    course.status === 'published' ? 'default' : 'secondary'
                  }
                >
                  {course.status === 'published'
                    ? '공개'
                    : course.status === 'draft'
                      ? '비공개'
                      : '종료'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{course.instructorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{course.enrollmentCount}명 수강 중</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(course.createdAt), 'yyyy년 MM월 dd일', {
                  locale: ko,
                })}
              </span>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">코스 소개</h3>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {course.description}
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">강사 정보</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{course.instructorName}</p>
                <p className="text-sm text-muted-foreground">강사</p>
              </div>
            </div>
          </div>

          <EnrollButton
            courseId={course.id}
            isEnrolled={course.isEnrolled}
            courseTitle={course.title}
          />
        </CardContent>
      </Card>

      {course.isEnrolled && (
        <div className="mt-6 space-y-6">
          {/* 마감 임박 과제 섹션 */}
          {assignmentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <DueSoonAssignments courseId={id} assignments={assignments || []} />
          )}

          {/* 전체 과제 목록 */}
          {assignmentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <AssignmentListCard courseId={id} assignments={assignments || []} />
          )}
        </div>
      )}
    </div>
  );
}

