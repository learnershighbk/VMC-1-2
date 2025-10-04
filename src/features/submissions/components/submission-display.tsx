'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import type { SubmissionDetail } from '@/features/assignments/backend/schema';

interface SubmissionDisplayProps {
  submission: SubmissionDetail;
  allowResubmission: boolean;
}

export function SubmissionDisplay({ submission, allowResubmission }: SubmissionDisplayProps) {
  const getStatusBadge = () => {
    if (submission.status === 'graded') {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          채점 완료
        </Badge>
      );
    }
    
    if (submission.status === 'resubmission_required') {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          재제출 요청
        </Badge>
      );
    }
    
    if (submission.late) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Clock className="h-3 w-3" />
          지각 제출
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        제출 완료
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>제출 정보</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          {format(new Date(submission.submittedAt), 'PPP p', { locale: ko })} 제출
          {submission.version > 1 && ` (${submission.version}차 제출)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">제출 내용</h4>
          <p className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-md">
            {submission.contentText}
          </p>
        </div>

        {submission.contentLink && (
          <div>
            <h4 className="font-semibold mb-2">첨부 링크</h4>
            <a
              href={submission.contentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              {submission.contentLink}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {submission.status === 'graded' && submission.score !== null && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">채점 결과</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">점수:</span>
                <span className="text-lg font-bold">{submission.score}점</span>
              </div>
              {submission.feedback && (
                <div>
                  <span className="text-sm text-muted-foreground">피드백:</span>
                  <p className="text-sm mt-1 bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {submission.feedback}
                  </p>
                </div>
              )}
              {submission.gradedAt && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(submission.gradedAt), 'PPP p', { locale: ko })} 채점 완료
                </p>
              )}
            </div>
          </div>
        )}

        {submission.status === 'resubmission_required' && submission.feedback && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 text-destructive">재제출 요청</h4>
            <p className="text-sm bg-destructive/10 p-3 rounded-md whitespace-pre-wrap">
              {submission.feedback}
            </p>
          </div>
        )}

        {allowResubmission && submission.status !== 'resubmission_required' && (
          <div className="text-sm text-muted-foreground border-t pt-4">
            💡 이 과제는 재제출이 가능합니다. 아래에서 다시 제출할 수 있습니다.
          </div>
        )}

        {submission.status === 'resubmission_required' && (
          <div className="text-sm text-muted-foreground border-t pt-4">
            ⚠️ 강사가 재제출을 요청했습니다. 아래에서 다시 제출해주세요.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

