'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import type { AssignmentSubmissionItem } from '../lib/dto';
import { useReviewSubmission } from '../hooks/useReviewSubmission';
import { extractApiErrorMessage } from '@/lib/remote/api-client';

const reviewFormSchema = z
  .object({
    action: z.enum(['grade', 'requestResubmission']),
    score: z.number().int().min(0).max(100).optional(),
    feedback: z.string().min(1, '피드백은 필수입니다.').trim(),
  })
  .refine(
    (data) => {
      if (data.action === 'grade') {
        return data.score !== undefined && data.score !== null;
      }
      return true;
    },
    {
      message: '채점 시 점수는 필수입니다.',
      path: ['score'],
    }
  );

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

interface SubmissionReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: AssignmentSubmissionItem | null;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export const SubmissionReviewDialog = ({
  open,
  onOpenChange,
  submission,
  onSuccess,
  onError,
}: SubmissionReviewDialogProps) => {
  const [actionMode, setActionMode] = useState<'grade' | 'requestResubmission'>('grade');
  const reviewMutation = useReviewSubmission();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      action: 'grade',
      score: submission?.score ?? undefined,
      feedback: submission?.feedback ?? '',
    },
  });

  const handleSubmit = async (values: ReviewFormValues) => {
    if (!submission) return;

    try {
      await reviewMutation.mutateAsync({
        submissionId: submission.id,
        input: {
          action: actionMode,
          score: actionMode === 'grade' ? values.score : undefined,
          feedback: values.feedback,
        },
      });

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      const errorMessage = extractApiErrorMessage(error);
      onError(errorMessage);
    }
  };

  const handleActionChange = (action: 'grade' | 'requestResubmission') => {
    setActionMode(action);
    form.setValue('action', action);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  if (!open || !submission) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          'relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl',
          'animate-in fade-in-0 zoom-in-95'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">닫기</span>
        </button>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">제출물 검토</h2>
            <p className="text-sm text-muted-foreground mt-1">
              학습자: {submission.learnerName}
            </p>
          </div>

          <div className="space-y-2">
            <Label>제출 내용</Label>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap border rounded-md p-3">
              {submission.contentText}
            </p>
            {submission.contentLink && (
              <a
                href={submission.contentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {submission.contentLink}
              </a>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={actionMode === 'grade' ? 'default' : 'outline'}
              onClick={() => handleActionChange('grade')}
              className="flex-1"
            >
              채점하기
            </Button>
            <Button
              type="button"
              variant={actionMode === 'requestResubmission' ? 'default' : 'outline'}
              onClick={() => handleActionChange('requestResubmission')}
              className="flex-1"
            >
              재제출 요청
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {actionMode === 'grade' && (
                <FormField
                  control={form.control}
                  name="score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>점수 (0-100)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="점수를 입력하세요"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? undefined : Number(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>피드백</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="피드백을 입력하세요"
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={reviewMutation.isPending}
                >
                  취소
                </Button>
                <Button type="submit" disabled={reviewMutation.isPending}>
                  {reviewMutation.isPending
                    ? '처리 중...'
                    : actionMode === 'grade'
                    ? '채점 완료'
                    : '재제출 요청'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

