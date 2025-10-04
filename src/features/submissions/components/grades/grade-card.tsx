'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { GradeStatusBadge } from './grade-status-badge';
import type { AssignmentGradeItem } from '@/features/submissions/lib/dto';
import { Calendar, Target } from 'lucide-react';

interface GradeCardProps {
  grade: AssignmentGradeItem;
}

export function GradeCard({ grade }: GradeCardProps) {
  const dueDate = new Date(grade.dueAt);
  const hasScore = grade.score !== null && grade.status === 'graded';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{grade.assignmentTitle}</CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                마감: {format(dueDate, 'PPP', { locale: ko })}
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                비중: {grade.scoreWeight}%
              </span>
            </CardDescription>
          </div>
          <GradeStatusBadge grade={grade} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasScore ? (
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">획득 점수</p>
              <p className="text-4xl font-bold text-primary">{grade.score}점</p>
              <p className="text-xs text-muted-foreground mt-1">
                가중 점수: {((grade.score * grade.scoreWeight) / 100).toFixed(1)}점
              </p>
            </div>
          </div>
        ) : grade.submissionId ? (
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-center text-muted-foreground">채점 대기 중</p>
          </div>
        ) : (
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="text-center text-muted-foreground">미제출</p>
          </div>
        )}

        {grade.feedback && (
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium mb-2">강사 피드백</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {grade.feedback}
            </p>
            {grade.gradedAt && (
              <p className="text-xs text-muted-foreground mt-2">
                채점일: {format(new Date(grade.gradedAt), 'PPP p', { locale: ko })}
              </p>
            )}
          </div>
        )}

        {grade.status === 'resubmission_required' && (
          <div className="rounded-lg border border-destructive/50 p-4 bg-destructive/5">
            <p className="text-sm font-medium text-destructive mb-1">재제출이 필요합니다</p>
            <p className="text-xs text-muted-foreground">
              강사의 피드백을 확인하고 과제를 다시 제출해주세요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

