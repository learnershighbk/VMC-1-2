'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { format, isPast, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import type { AssignmentDetailResponse } from '../lib/dto';
import { getAssignmentDueStatus } from '@/lib/utils/assignment';

interface AssignmentListCardProps {
  courseId: string;
  assignments: AssignmentDetailResponse[];
}

export function AssignmentListCard({ courseId, assignments }: AssignmentListCardProps) {
  const router = useRouter();

  if (!assignments || assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>과제 목록</CardTitle>
          <CardDescription>아직 등록된 과제가 없습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getSubmissionStatus = (assignment: AssignmentDetailResponse) => {
    if (!assignment.submission) {
      return {
        icon: <XCircle className="w-4 h-4" />,
        text: '미제출',
        variant: 'destructive' as const,
      };
    }

    if (assignment.submission.status === 'graded') {
      return {
        icon: <CheckCircle2 className="w-4 h-4" />,
        text: `채점 완료 (${assignment.submission.score}점)`,
        variant: 'default' as const,
      };
    }

    if (assignment.submission.status === 'resubmission_required') {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: '재제출 필요',
        variant: 'destructive' as const,
      };
    }

    return {
      icon: <CheckCircle2 className="w-4 h-4" />,
      text: assignment.submission.late ? '지각 제출' : '제출 완료',
      variant: assignment.submission.late ? ('secondary' as const) : ('default' as const),
    };
  };

  const getDueDateStatus = (dueAt: string) => {
    const dueStatus = getAssignmentDueStatus(dueAt);
    const dueDate = new Date(dueAt);

    switch (dueStatus.status) {
      case 'overdue':
        return {
          color: 'text-destructive',
          text: '마감됨',
          bgColor: 'bg-destructive/5',
          borderColor: 'border-destructive/20',
        };
      case 'due_today':
        return {
          color: 'text-orange-600',
          text: '오늘 마감',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
        };
      case 'due_soon':
        return {
          color: 'text-yellow-600',
          text: `${dueStatus.daysLeft}일 남음`,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        };
      default:
        return {
          color: 'text-muted-foreground',
          text: format(dueDate, 'M월 d일', { locale: ko }),
          bgColor: 'bg-background',
          borderColor: 'border-border',
        };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>과제 목록</CardTitle>
        <CardDescription>
          총 {assignments.length}개의 과제가 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignments.map((assignment) => {
          const submissionStatus = getSubmissionStatus(assignment);
          const dueDateStatus = getDueDateStatus(assignment.dueAt);

          return (
            <Card
              key={assignment.id}
              className={`hover:shadow-md transition-shadow cursor-pointer ${dueDateStatus.bgColor} ${dueDateStatus.borderColor}`}
              onClick={() => router.push(`/courses/${courseId}/assignments/${assignment.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-1">
                      {assignment.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {assignment.description}
                    </CardDescription>
                  </div>
                  <Badge variant={submissionStatus.variant} className="flex items-center gap-1 shrink-0">
                    {submissionStatus.icon}
                    {submissionStatus.text}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1 ${dueDateStatus.color}`}>
                      <Calendar className="w-4 h-4" />
                      <span>{dueDateStatus.text}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(assignment.dueAt), 'HH:mm', { locale: ko })}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    배점 {assignment.scoreWeight}점
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}

