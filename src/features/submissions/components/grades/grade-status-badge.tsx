'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';
import type { AssignmentGradeItem } from '@/features/submissions/lib/dto';

interface GradeStatusBadgeProps {
  grade: AssignmentGradeItem;
}

export function GradeStatusBadge({ grade }: GradeStatusBadgeProps) {
  if (!grade.submissionId) {
    return (
      <Badge variant="outline" className="gap-1">
        <XCircle className="h-3 w-3" />
        미제출
      </Badge>
    );
  }

  if (grade.status === 'graded') {
    return (
      <div className="flex gap-2">
        <Badge variant="default" className="gap-1 bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          채점 완료
        </Badge>
        {grade.late && (
          <Badge variant="destructive" className="gap-1">
            지각 제출
          </Badge>
        )}
      </div>
    );
  }

  if (grade.status === 'resubmission_required') {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3 w-3" />
        재제출 요청
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <Clock className="h-3 w-3" />
      채점 대기
    </Badge>
  );
}

