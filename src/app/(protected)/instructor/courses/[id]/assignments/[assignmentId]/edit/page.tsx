'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssignmentDetail } from '@/features/assignments/hooks/useAssignmentDetail';
import { useUpdateAssignment } from '@/features/assignments/hooks/useUpdateAssignment';
import { usePublishAssignment } from '@/features/assignments/hooks/usePublishAssignment';
import { useCloseAssignment } from '@/features/assignments/hooks/useCloseAssignment';
import { useDeleteAssignment } from '@/features/assignments/hooks/useDeleteAssignment';
import { AssignmentForm } from '@/features/assignments/components/assignment-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, Ban, Trash2, Users } from 'lucide-react';
import type { CreateAssignmentInput } from '@/features/assignments/lib/dto';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { SuccessDialog } from '@/components/ui/success-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { extractApiErrorMessage } from '@/lib/remote/api-client';

interface EditAssignmentPageProps {
  params: Promise<{ id: string; assignmentId: string }>;
}

export default function EditAssignmentPage({ params }: EditAssignmentPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: assignment, isLoading, error } = useAssignmentDetail(resolvedParams.assignmentId);
  const updateAssignment = useUpdateAssignment(resolvedParams.assignmentId);
  const publishAssignment = usePublishAssignment(resolvedParams.assignmentId);
  const closeAssignment = useCloseAssignment(resolvedParams.assignmentId);
  const deleteAssignment = useDeleteAssignment(
    resolvedParams.assignmentId,
    resolvedParams.id
  );

  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleUpdate = async (data: CreateAssignmentInput) => {
    try {
      await updateAssignment.mutateAsync(data);
      setShowSuccess(true);
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err, '과제 수정에 실패했습니다.'));
      setShowError(true);
    }
  };

  const handlePublish = async () => {
    try {
      await publishAssignment.mutateAsync();
      setShowSuccess(true);
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err, '과제 게시에 실패했습니다.'));
      setShowError(true);
    }
  };

  const handleClose = async () => {
    try {
      await closeAssignment.mutateAsync();
      setShowSuccess(true);
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err, '과제 마감에 실패했습니다.'));
      setShowError(true);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAssignment.mutateAsync();
      router.push(`/instructor/courses/${resolvedParams.id}/edit`);
    } catch (err) {
      setErrorMessage(extractApiErrorMessage(err, '과제 삭제에 실패했습니다.'));
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

  if (error || !assignment) {
    return (
      <ErrorDialog
        open={true}
        title="과제 조회 실패"
        message={extractApiErrorMessage(error, '과제를 불러올 수 없습니다.')}
        onClose={() => router.push(`/instructor/courses/${resolvedParams.id}/edit`)}
      />
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">과제 수정</h1>
          <p className="text-muted-foreground mt-2">{assignment.courseTitle}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/instructor/courses/${resolvedParams.id}/assignments/${resolvedParams.assignmentId}/submissions`
              )
            }
          >
            <Users className="w-4 h-4 mr-2" />
            제출물 관리
          </Button>
          {assignment.status === 'draft' && (
            <Button onClick={handlePublish} disabled={publishAssignment.isPending}>
              <CheckCircle className="w-4 h-4 mr-2" />
              {publishAssignment.isPending ? '게시 중...' : '과제 게시'}
            </Button>
          )}
          {assignment.status === 'published' && (
            <Button onClick={handleClose} disabled={closeAssignment.isPending}>
              <Ban className="w-4 h-4 mr-2" />
              {closeAssignment.isPending ? '마감 중...' : '과제 마감'}
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setConfirmDelete(true)}
            disabled={deleteAssignment.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            삭제
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>과제 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <AssignmentForm
                mode="edit"
                courseId={assignment.courseId}
                assignmentStatus={assignment.status}
                initialData={{
                  title: assignment.title,
                  description: assignment.description,
                  dueAt: assignment.dueAt,
                  scoreWeight: assignment.scoreWeight,
                  allowLate: assignment.allowLate,
                  allowResubmission: assignment.allowResubmission,
                }}
                onSubmit={handleUpdate}
                isLoading={updateAssignment.isPending}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>과제 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">상태</span>
                  <span className="font-medium">
                    {assignment.status === 'draft' && '작성 중'}
                    {assignment.status === 'published' && '진행 중'}
                    {assignment.status === 'closed' && '마감됨'}
                  </span>
                </div>
                {assignment.publishedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">게시일</span>
                    <span className="text-xs">
                      {new Date(assignment.publishedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )}
                {assignment.closedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">마감일</span>
                    <span className="text-xs">
                      {new Date(assignment.closedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )}
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
        title="과제 삭제 확인"
        message="정말로 이 과제를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        confirmText="삭제"
        cancelText="취소"
        variant="destructive"
        isLoading={deleteAssignment.isPending}
      />
    </div>
  );
}

