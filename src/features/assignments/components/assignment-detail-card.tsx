'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, Weight, CheckCircle, XCircle } from 'lucide-react';
import { AssignmentStatus } from './assignment-status';
import { formatDueDate, getDueDateStatus, isOverdue } from '@/lib/utils/date';
import type { AssignmentDetailResponse } from '../lib/dto';

interface AssignmentDetailCardProps {
  assignment: AssignmentDetailResponse;
}

export const AssignmentDetailCard = ({ assignment }: AssignmentDetailCardProps) => {
  const dueStatus = getDueDateStatus(assignment.dueAt);
  const overdue = isOverdue(assignment.dueAt);
  const canSubmit = 
    assignment.status === 'published' && 
    (!overdue || assignment.allowLate);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{assignment.courseTitle}</p>
            <CardTitle className="text-2xl mt-1">{assignment.title}</CardTitle>
          </div>
          <AssignmentStatus status={assignment.status} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-2">과제 설명</p>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: assignment.description }}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>마감일</span>
            </div>
            <p className="font-medium">{formatDueDate(assignment.dueAt)}</p>
            <Badge variant={overdue ? 'destructive' : 'default'}>
              {dueStatus}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Weight className="h-4 w-4" />
              <span>점수 비중</span>
            </div>
            <p className="font-medium">{assignment.scoreWeight}%</p>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-2">제출 정책</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {assignment.allowLate ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">
                {assignment.allowLate ? '지각 제출 허용' : '지각 제출 불가'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {assignment.allowResubmission ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">
                {assignment.allowResubmission ? '재제출 허용' : '재제출 불가'}
              </span>
            </div>
          </div>
        </div>

        {assignment.status === 'closed' && (
          <div className="p-3 bg-gray-50 border rounded">
            <p className="text-sm text-gray-700">
              이 과제는 마감되었습니다. 더 이상 제출할 수 없습니다.
            </p>
          </div>
        )}

        {assignment.status === 'published' && overdue && !assignment.allowLate && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              마감일이 지났습니다. 지각 제출이 허용되지 않습니다.
            </p>
          </div>
        )}

        {canSubmit && !assignment.submission && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              과제를 제출할 수 있습니다. 아래에서 제출해주세요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

