'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SuccessDialog } from '@/components/ui/success-dialog';
import { ErrorDialog } from '@/components/ui/error-dialog';
import { useSubmitAssignment } from '../hooks/useSubmitAssignment';
import { SubmitAssignmentSchema } from '../lib/dto';
import type { SubmitAssignmentRequest } from '../lib/dto';
import { extractApiErrorMessage } from '@/lib/remote/api-client';
import { format, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';
import { AlertCircle, Send } from 'lucide-react';
import type { AssignmentDetailResponse } from '@/features/assignments/backend/schema';

interface SubmissionFormProps {
  assignmentId: string;
  assignment: AssignmentDetailResponse;
  onSubmitSuccess?: () => void;
}

export function SubmissionForm({ assignmentId, assignment, onSubmitSuccess }: SubmissionFormProps) {
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLateSubmission, setIsLateSubmission] = useState(false);

  const { mutate: submitAssignment, isPending } = useSubmitAssignment();

  const form = useForm<SubmitAssignmentRequest>({
    resolver: zodResolver(SubmitAssignmentSchema),
    defaultValues: {
      assignmentId,
      textContent: '',
      linkContent: '',
    },
  });

  const dueDate = new Date(assignment.dueAt);
  const isAfterDue = isPast(dueDate);
  const canSubmit = assignment.status === 'published' && (assignment.allowLate || !isAfterDue);
  const hasExistingSubmission = !!assignment.submission;
  const canResubmit = hasExistingSubmission && assignment.allowResubmission;

  const onSubmit = (data: SubmitAssignmentRequest) => {
    const now = new Date();
    const isLate = now > dueDate;
    setIsLateSubmission(isLate);

    submitAssignment(data, {
      onSuccess: () => {
        setSuccessOpen(true);
        form.reset({
          assignmentId,
          textContent: '',
          linkContent: '',
        });
        onSubmitSuccess?.();
      },
      onError: (error) => {
        setErrorMessage(extractApiErrorMessage(error, '제출에 실패했습니다.'));
        setErrorOpen(true);
      },
    });
  };

  const getSuccessMessage = () => {
    if (isLateSubmission) {
      return '지각 제출되었습니다.';
    }
    if (hasExistingSubmission) {
      return '재제출이 완료되었습니다.';
    }
    return '제출이 완료되었습니다.';
  };

  if (assignment.status === 'closed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>과제 제출</CardTitle>
          <CardDescription>이 과제는 마감되었습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>마감된 과제는 제출할 수 없습니다.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (assignment.status !== 'published') {
    return null;
  }

  if (isAfterDue && !assignment.allowLate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>과제 제출</CardTitle>
          <CardDescription>마감일이 지났습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>마감일이 지나 제출할 수 없습니다. (지각 제출 불허)</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasExistingSubmission && !assignment.allowResubmission && assignment.submission.status !== 'resubmission_required') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>과제 제출</CardTitle>
          <CardDescription>이미 제출한 과제입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>이 과제는 재제출이 허용되지 않습니다.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>과제 제출</CardTitle>
          <CardDescription>
            마감일: {format(dueDate, 'PPP p', { locale: ko })}
            {isAfterDue && assignment.allowLate && (
              <span className="text-destructive ml-2">(지각 제출 가능)</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="textContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제출 내용 *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="과제 내용을 입력해주세요..."
                        className="min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      과제 제출 내용을 작성해주세요. (필수)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>첨부 링크</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      관련 자료 링크를 입력해주세요. (선택)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAfterDue && assignment.allowLate && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-center gap-2 text-sm text-yellow-800">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>
                      마감일이 지났습니다. 지각 제출로 기록됩니다.
                    </span>
                  </div>
                </div>
              )}

              {hasExistingSubmission && canResubmit && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>
                      이미 제출한 과제입니다. 제출 시 새 버전으로 저장됩니다.
                    </span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={!canSubmit || isPending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isPending
                  ? '제출 중...'
                  : hasExistingSubmission
                  ? '재제출하기'
                  : '제출하기'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <SuccessDialog
        open={successOpen}
        title="제출 완료"
        message={getSuccessMessage()}
        onClose={() => setSuccessOpen(false)}
      />

      <ErrorDialog
        open={errorOpen}
        title="제출 실패"
        message={errorMessage}
        onClose={() => setErrorOpen(false)}
      />
    </>
  );
}

