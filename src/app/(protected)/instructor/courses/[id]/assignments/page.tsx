'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useCourseDetail } from '@/features/courses/hooks/useCourseDetail';
import { useCourseAssignments } from '@/features/assignments/hooks/useCourseAssignments';
import { usePublishAssignment } from '@/features/assignments/hooks/usePublishAssignment';
import { useCloseAssignment } from '@/features/assignments/hooks/useCloseAssignment';
import { useDeleteAssignment } from '@/features/assignments/hooks/useDeleteAssignment';
import { AssignmentActionsBar } from '@/features/assignments/components/assignment-actions-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { SuccessDialog } from '@/components/ui/success-dialog';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { Plus, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { AssignmentDetailResponse } from '@/features/assignments/lib/dto';

type ActionType = 'publish' | 'close' | 'delete' | null;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InstructorAssignmentsPage({ params }: PageProps) {
  const { id: courseId } = use(params);

  const { data: course, isLoading: courseLoading } = useCourseDetail(courseId);
  const { data: assignments, isLoading: assignmentsLoading } = useCourseAssignments(courseId);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'destructive' | 'default';
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [currentAssignment, setCurrentAssignment] = useState<AssignmentDetailResponse | null>(null);
  const [currentAction, setCurrentAction] = useState<ActionType>(null);

  const publishMutation = usePublishAssignment(currentAssignment?.id || '');
  const closeMutation = useCloseAssignment(currentAssignment?.id || '');
  const deleteMutation = useDeleteAssignment(currentAssignment?.id || '', courseId);

  const handlePublish = (assignment: AssignmentDetailResponse) => {
    setCurrentAssignment(assignment);
    setCurrentAction('publish');
    setConfirmDialog({
      open: true,
      title: '과제 게시',
      message: `"${assignment.title}" 과제를 게시하시겠습니까? 게시하면 학습자에게 노출됩니다.`,
      onConfirm: () => {
        publishMutation.mutate(undefined, {
          onSuccess: () => {
            setSuccessMessage('과제가 게시되었습니다.');
            setConfirmDialog({ ...confirmDialog, open: false });
            setCurrentAssignment(null);
            setCurrentAction(null);
          },
          onError: (error: any) => {
            setErrorMessage(error.response?.data?.error || '게시에 실패했습니다.');
            setConfirmDialog({ ...confirmDialog, open: false });
            setCurrentAssignment(null);
            setCurrentAction(null);
          },
        });
      },
    });
  };

  const handleClose = (assignment: AssignmentDetailResponse) => {
    setCurrentAssignment(assignment);
    setCurrentAction('close');
    setConfirmDialog({
      open: true,
      title: '과제 마감',
      message: `"${assignment.title}" 과제를 마감하시겠습니까? 마감 후에는 학습자가 제출할 수 없습니다.`,
      onConfirm: () => {
        closeMutation.mutate(undefined, {
          onSuccess: () => {
            setSuccessMessage('과제가 마감되었습니다.');
            setConfirmDialog({ ...confirmDialog, open: false });
            setCurrentAssignment(null);
            setCurrentAction(null);
          },
          onError: (error: any) => {
            setErrorMessage(error.response?.data?.error || '마감에 실패했습니다.');
            setConfirmDialog({ ...confirmDialog, open: false });
            setCurrentAssignment(null);
            setCurrentAction(null);
          },
        });
      },
    });
  };

  const handleDelete = (assignment: AssignmentDetailResponse) => {
    setCurrentAssignment(assignment);
    setCurrentAction('delete');
    setConfirmDialog({
      open: true,
      title: '과제 삭제',
      message: `"${assignment.title}" 과제를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.`,
      onConfirm: () => {
        deleteMutation.mutate(undefined, {
          onSuccess: () => {
            setSuccessMessage('과제가 삭제되었습니다.');
            setConfirmDialog({ ...confirmDialog, open: false });
            setCurrentAssignment(null);
            setCurrentAction(null);
          },
          onError: (error: any) => {
            setErrorMessage(error.response?.data?.error || '삭제에 실패했습니다.');
            setConfirmDialog({ ...confirmDialog, open: false });
            setCurrentAssignment(null);
            setCurrentAction(null);
          },
        });
      },
      variant: 'destructive',
    });
  };

  if (courseLoading || assignmentsLoading) {
    return (
      <div className="container mx-auto py-8">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-8">
        <p>코스를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">작성 중</Badge>;
      case 'published':
        return <Badge variant="default">게시됨</Badge>;
      case 'closed':
        return <Badge variant="outline">마감됨</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/instructor/courses/${courseId}`}>
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              코스로 돌아가기
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{course.title} - 과제 관리</h1>
        </div>
        <Link href={`/instructor/courses/${courseId}/assignments/new`}>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            새 과제 만들기
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {!assignments || assignments.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">아직 생성된 과제가 없습니다.</p>
            <Link href={`/instructor/courses/${courseId}/assignments/new`}>
              <Button>첫 과제 만들기</Button>
            </Link>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">{assignment.title}</h3>
                    {getStatusBadge(assignment.status)}
                  </div>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {assignment.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      마감일:{' '}
                      {format(new Date(assignment.dueAt), 'PPP (p)', { locale: ko })}
                    </span>
                    <span>배점: {assignment.scoreWeight}%</span>
                    {assignment.allowLate && <Badge variant="outline">지각 허용</Badge>}
                    {assignment.allowResubmission && (
                      <Badge variant="outline">재제출 허용</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    href={`/instructor/courses/${courseId}/assignments/${assignment.id}/edit`}
                  >
                    <Button variant="outline" size="sm">
                      편집
                    </Button>
                  </Link>
                  <Link
                    href={`/instructor/courses/${courseId}/assignments/${assignment.id}/submissions`}
                  >
                    <Button variant="outline" size="sm">
                      제출물
                    </Button>
                  </Link>
                  <AssignmentActionsBar
                    assignment={assignment}
                    onPublish={() => handlePublish(assignment)}
                    onClose={() => handleClose(assignment)}
                    onDelete={() => handleDelete(assignment)}
                    isPublishing={
                      publishMutation.isPending && currentAssignment?.id === assignment.id && currentAction === 'publish'
                    }
                    isClosing={
                      closeMutation.isPending && currentAssignment?.id === assignment.id && currentAction === 'close'
                    }
                    isDeleting={
                      deleteMutation.isPending && currentAssignment?.id === assignment.id && currentAction === 'delete'
                    }
                  />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />

      <SuccessDialog
        open={!!successMessage}
        onClose={() => setSuccessMessage('')}
        title="성공"
        message={successMessage}
      />

      <ErrorDialog
        open={!!errorMessage}
        onClose={() => setErrorMessage('')}
        title="오류"
        message={errorMessage}
      />
    </div>
  );
}

