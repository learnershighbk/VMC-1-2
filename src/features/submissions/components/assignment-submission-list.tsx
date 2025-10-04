'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AssignmentSubmissionItem } from '../lib/dto';
import { match } from 'ts-pattern';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface AssignmentSubmissionListProps {
  assignment: {
    id: string;
    title: string;
    status: 'draft' | 'published' | 'closed';
    dueAt: string;
  };
  submissions: AssignmentSubmissionItem[];
  onOpenReview: (submission: AssignmentSubmissionItem) => void;
}

export const AssignmentSubmissionList = ({
  assignment,
  submissions,
  onOpenReview,
}: AssignmentSubmissionListProps) => {
  const getStatusBadge = (status: string) => {
    return match(status)
      .with('submitted', () => (
        <Badge variant="default" className="gap-1">
          <Clock className="h-3 w-3" />
          제출됨
        </Badge>
      ))
      .with('graded', () => (
        <Badge variant="outline" className="gap-1 border-green-500 text-green-700">
          <CheckCircle className="h-3 w-3" />
          채점완료
        </Badge>
      ))
      .with('resubmission_required', () => (
        <Badge variant="outline" className="gap-1 border-orange-500 text-orange-700">
          <AlertCircle className="h-3 w-3" />
          재제출요청
        </Badge>
      ))
      .otherwise(() => <Badge variant="secondary">{status}</Badge>);
  };

  const getActionButtons = (submission: AssignmentSubmissionItem) => {
    return match(submission.status)
      .with('submitted', () => (
        <>
          <Button
            size="sm"
            onClick={() => onOpenReview(submission)}
          >
            채점하기
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenReview(submission)}
          >
            재제출 요청
          </Button>
        </>
      ))
      .with('graded', () => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onOpenReview(submission)}
        >
          수정하기
        </Button>
      ))
      .with('resubmission_required', () => (
        <Button
          size="sm"
          onClick={() => onOpenReview(submission)}
        >
          채점하기
        </Button>
      ))
      .otherwise(() => null);
  };

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <img
          src="https://picsum.photos/seed/no-submissions/400/300"
          alt="제출물 없음"
          className="w-64 h-48 object-cover rounded-lg opacity-50"
        />
        <p className="text-muted-foreground text-center">
          아직 제출된 과제가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{assignment.title}</CardTitle>
              <CardDescription>
                마감일: {format(new Date(assignment.dueAt), 'PPP HH:mm', { locale: ko })}
              </CardDescription>
            </div>
            {match(assignment.status)
              .with('draft', () => <Badge variant="secondary">초안</Badge>)
              .with('published', () => <Badge variant="default">공개</Badge>)
              .with('closed', () => <Badge variant="outline">마감</Badge>)
              .otherwise(() => null)}
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {submissions.map((submission) => (
          <Card key={submission.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{submission.learnerName}</CardTitle>
                  <CardDescription>
                    제출 시간: {format(new Date(submission.submittedAt), 'PPP HH:mm', { locale: ko })}
                    {submission.late && (
                      <span className="ml-2 text-orange-600 font-medium">지각</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(submission.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">제출 내용</div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
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

              {submission.score !== null && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">점수</div>
                  <p className="text-2xl font-bold">{submission.score}점</p>
                </div>
              )}

              {submission.feedback && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">피드백</div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {submission.feedback}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {getActionButtons(submission)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

