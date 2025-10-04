'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import type { AssignmentDetailResponse } from '@/features/assignments/lib/dto';
import { getAssignmentDueStatus } from '@/lib/utils/assignment';

interface DueSoonAssignmentsProps {
  courseId: string;
  assignments: AssignmentDetailResponse[];
}

export function DueSoonAssignments({ courseId, assignments }: DueSoonAssignmentsProps) {
  const router = useRouter();

  // 마감 임박 과제 필터링 (3일 이내)
  const dueSoonAssignments = assignments.filter((assignment) => {
    const dueStatus = getAssignmentDueStatus(assignment.dueAt);
    return dueStatus.status === 'due_soon' || dueStatus.status === 'due_today';
  });

  // 마감된 과제 필터링
  const overdueAssignments = assignments.filter((assignment) => {
    const dueStatus = getAssignmentDueStatus(assignment.dueAt);
    return dueStatus.status === 'overdue';
  });

  if (dueSoonAssignments.length === 0 && overdueAssignments.length === 0) {
    return null;
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

    return {
      icon: <CheckCircle2 className="w-4 h-4" />,
      text: assignment.submission.late ? '지각 제출' : '제출 완료',
      variant: assignment.submission.late ? ('secondary' as const) : ('default' as const),
    };
  };

  const getDueDateDisplay = (dueAt: string) => {
    const dueStatus = getAssignmentDueStatus(dueAt);
    const dueDate = new Date(dueAt);

    switch (dueStatus.status) {
      case 'overdue':
        return {
          text: '마감됨',
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/20',
        };
      case 'due_today':
        return {
          text: '오늘 마감',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
        };
      case 'due_soon':
        return {
          text: `${dueStatus.daysLeft}일 남음`,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        };
      default:
        return {
          text: format(dueDate, 'M월 d일', { locale: ko }),
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/50',
          borderColor: 'border-border',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* 마감된 과제 */}
      {overdueAssignments.length > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-lg text-destructive">마감된 과제</CardTitle>
            </div>
            <CardDescription>
              {overdueAssignments.length}개의 과제가 마감되었습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueAssignments.map((assignment) => {
              const submissionStatus = getSubmissionStatus(assignment);
              const dueDateDisplay = getDueDateDisplay(assignment.dueAt);

              return (
                <Card
                  key={assignment.id}
                  className={`hover:shadow-md transition-shadow cursor-pointer ${dueDateDisplay.bgColor} ${dueDateDisplay.borderColor}`}
                  onClick={() => router.push(`/courses/${courseId}/assignments/${assignment.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base line-clamp-1">
                          {assignment.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {assignment.description}
                        </p>
                      </div>
                      <Badge variant={submissionStatus.variant} className="flex items-center gap-1 shrink-0">
                        {submissionStatus.icon}
                        {submissionStatus.text}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <div className={`flex items-center gap-1 ${dueDateDisplay.color}`}>
                        <Calendar className="w-4 h-4" />
                        <span>{dueDateDisplay.text}</span>
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
      )}

      {/* 마감 임박 과제 */}
      {dueSoonAssignments.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <CardTitle className="text-lg text-yellow-800">마감 임박 과제</CardTitle>
            </div>
            <CardDescription>
              {dueSoonAssignments.length}개의 과제가 곧 마감됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dueSoonAssignments.map((assignment) => {
              const submissionStatus = getSubmissionStatus(assignment);
              const dueDateDisplay = getDueDateDisplay(assignment.dueAt);

              return (
                <Card
                  key={assignment.id}
                  className={`hover:shadow-md transition-shadow cursor-pointer ${dueDateDisplay.bgColor} ${dueDateDisplay.borderColor}`}
                  onClick={() => router.push(`/courses/${courseId}/assignments/${assignment.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base line-clamp-1">
                          {assignment.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {assignment.description}
                        </p>
                      </div>
                      <Badge variant={submissionStatus.variant} className="flex items-center gap-1 shrink-0">
                        {submissionStatus.icon}
                        {submissionStatus.text}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-sm">
                      <div className={`flex items-center gap-1 ${dueDateDisplay.color}`}>
                        <Calendar className="w-4 h-4" />
                        <span>{dueDateDisplay.text}</span>
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
      )}
    </div>
  );
}
