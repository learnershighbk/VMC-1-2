'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDueDate } from '@/lib/utils/date';
import type { SubmissionDetail } from '../lib/dto';
import { match } from 'ts-pattern';

interface SubmissionInfoProps {
  submission: SubmissionDetail;
}

export const SubmissionInfo = ({ submission }: SubmissionInfoProps) => {
  const statusLabel = match(submission.status)
    .with('submitted', () => '제출 완료')
    .with('graded', () => '채점 완료')
    .with('resubmission_required', () => '재제출 필요')
    .exhaustive();

  const statusVariant = match(submission.status)
    .with('submitted', () => 'default' as const)
    .with('graded', () => 'default' as const)
    .with('resubmission_required', () => 'destructive' as const)
    .exhaustive();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>제출 내역</span>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground">제출일</p>
          <p className="font-medium">{formatDueDate(submission.submittedAt)}</p>
          {submission.late && (
            <Badge variant="destructive" className="mt-1">지각 제출</Badge>
          )}
        </div>

        <div>
          <p className="text-sm text-muted-foreground">제출 내용</p>
          <p className="whitespace-pre-wrap">{submission.contentText}</p>
          {submission.contentLink && (
            <a
              href={submission.contentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm mt-1 block"
            >
              첨부 링크
            </a>
          )}
        </div>

        {submission.status === 'graded' && (
          <>
            <div>
              <p className="text-sm text-muted-foreground">점수</p>
              <p className="text-2xl font-bold">{submission.score}점</p>
            </div>

            {submission.feedback && (
              <div>
                <p className="text-sm text-muted-foreground">피드백</p>
                <p className="whitespace-pre-wrap">{submission.feedback}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">채점일</p>
              <p className="text-sm">
                {submission.gradedAt ? formatDueDate(submission.gradedAt) : '-'}
              </p>
            </div>
          </>
        )}

        {submission.status === 'resubmission_required' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              재제출이 필요합니다. 피드백을 확인하고 다시 제출해주세요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

