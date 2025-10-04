'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCourseDetail } from '@/features/courses/hooks/useCourseDetail';
import { useUpdateCourse } from '@/features/courses/hooks/useUpdateCourse';
import { usePublishCourse } from '@/features/courses/hooks/usePublishCourse';
import { useDeleteCourse } from '@/features/courses/hooks/useDeleteCourse';
import { useCourseAssignments } from '@/features/assignments/hooks/useCourseAssignments';
import { CourseForm } from '@/features/courses/components/course-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, CheckCircle, Edit, Calendar } from 'lucide-react';
import type { CreateCourseInput } from '@/features/courses/lib/dto';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { SuccessDialog } from '@/components/ui/success-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { extractApiErrorMessage } from '@/lib/remote/api-client';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface EditCoursePageProps {
  params: Promise<{ id: string }>;
}

export default function EditCoursePage({ params }: EditCoursePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: course, isLoading, error } = useCourseDetail(resolvedParams.id);
  const { data: assignments, isLoading: assignmentsLoading } = useCourseAssignments(resolvedParams.id);
  const updateCourse = useUpdateCourse(resolvedParams.id);
  const publishCourse = usePublishCourse(resolvedParams.id);
  const deleteCourse = useDeleteCourse(resolvedParams.id);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleUpdate = async (data: CreateCourseInput) => {
    try {
      await updateCourse.mutateAsync(data);
      setShowSuccess(true);
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err, '코스 수정에 실패했습니다.'));
      setShowError(true);
    }
  };

  const handlePublish = async () => {
    try {
      await publishCourse.mutateAsync();
      setShowSuccess(true);
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err, '코스 게시에 실패했습니다.'));
      setShowError(true);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCourse.mutateAsync();
      router.push('/instructor/dashboard');
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err, '코스 삭제에 실패했습니다.'));
      setShowError(true);
      setConfirmDelete(false);
    }
  };

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
        title="코스 조회 실패"
        message={extractApiErrorMessage(error, '코스를 불러올 수 없습니다.')}
        onClose={() => router.push('/instructor/dashboard')}
      />
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">코스 수정</h1>
          <p className="text-muted-foreground mt-2">
            코스 정보를 수정하고 과제를 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          {course.status === 'draft' && (
            <Button onClick={handlePublish} disabled={publishCourse.isPending}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {publishCourse.isPending ? '게시 중...' : '코스 게시'}
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setConfirmDelete(true)}
            disabled={deleteCourse.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            삭제
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>코스 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <CourseForm
                mode="edit"
                initialData={{
                  title: course.title,
                  description: course.description,
                  category: course.category,
                  difficulty: course.difficulty as 'beginner' | 'intermediate' | 'advanced',
                }}
                onSubmit={handleUpdate}
                isLoading={updateCourse.isPending}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>과제 관리</CardTitle>
              <Button
                size="sm"
                onClick={() => router.push(`/instructor/courses/${course.id}/assignments/new`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                새 과제 추가
              </Button>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !assignments || assignments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    아직 등록된 과제가 없습니다.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    첫 번째 과제를 추가해보세요!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <Card
                      key={assignment.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/instructor/courses/${course.id}/assignments/${assignment.id}/edit`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm line-clamp-1">
                                {assignment.title}
                              </h4>
                              <Badge
                                variant={
                                  assignment.status === 'draft'
                                    ? 'secondary'
                                    : assignment.status === 'published'
                                    ? 'default'
                                    : 'outline'
                                }
                                className="text-xs shrink-0"
                              >
                                {assignment.status === 'draft' && '작성 중'}
                                {assignment.status === 'published' && '게시됨'}
                                {assignment.status === 'closed' && '마감됨'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                              {assignment.description}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {format(new Date(assignment.dueAt), 'M월 d일 HH:mm', {
                                    locale: ko,
                                  })}
                                </span>
                              </div>
                              <span>배점 {assignment.scoreWeight}점</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/instructor/courses/${course.id}/assignments/${assignment.id}/edit`);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>코스 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">상태</span>
                  <span className="font-medium">
                    {course.status === 'draft' && '작성 중'}
                    {course.status === 'published' && '게시됨'}
                    {course.status === 'archived' && '보관됨'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">수강생 수</span>
                  <span className="font-medium">{course.enrollmentCount}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">과제 수</span>
                  <span className="font-medium">{assignments?.length || 0}개</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <SuccessDialog
        open={showSuccess}
        title="저장 완료"
        message="변경사항이 성공적으로 저장되었습니다."
        onClose={() => setShowSuccess(false)}
      />

      <ErrorDialog
        open={showError}
        title="오류 발생"
        message={errorMessage}
        onClose={() => setShowError(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="코스 삭제 확인"
        message="정말로 이 코스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        confirmText="삭제"
        cancelText="취소"
        variant="destructive"
        isLoading={deleteCourse.isPending}
      />
    </div>
  );
}

