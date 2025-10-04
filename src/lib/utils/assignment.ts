import { differenceInDays, isPast } from 'date-fns';
import type { AssignmentDetailResponse } from '@/features/assignments/lib/dto';

/**
 * 마감 임박 과제를 필터링합니다 (3일 이내)
 */
export const getDueSoonAssignments = (assignments: AssignmentDetailResponse[]) => {
  const now = new Date();
  
  return assignments.filter((assignment) => {
    const dueDate = new Date(assignment.dueAt);
    const daysLeft = differenceInDays(dueDate, now);
    
    // 마감되지 않았고 3일 이내인 과제
    return !isPast(dueDate) && daysLeft <= 3 && daysLeft >= 0;
  });
};

/**
 * 마감된 과제를 필터링합니다
 */
export const getOverdueAssignments = (assignments: AssignmentDetailResponse[]) => {
  return assignments.filter((assignment) => {
    const dueDate = new Date(assignment.dueAt);
    return isPast(dueDate);
  });
};

/**
 * 과제의 마감 상태를 반환합니다
 */
export const getAssignmentDueStatus = (dueAt: string) => {
  const dueDate = new Date(dueAt);
  const now = new Date();
  const daysLeft = differenceInDays(dueDate, now);
  const isOverdue = isPast(dueDate);

  if (isOverdue) {
    return {
      status: 'overdue' as const,
      daysLeft: 0,
      urgency: 'high' as const,
    };
  }

  if (daysLeft <= 1) {
    return {
      status: 'due_today' as const,
      daysLeft,
      urgency: 'high' as const,
    };
  }

  if (daysLeft <= 3) {
    return {
      status: 'due_soon' as const,
      daysLeft,
      urgency: 'medium' as const,
    };
  }

  return {
    status: 'normal' as const,
    daysLeft,
    urgency: 'low' as const,
  };
};
