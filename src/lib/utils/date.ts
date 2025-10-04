import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
};

export const formatDueDate = (dateString: string): string => {
  return formatDate(dateString);
};

export const getDueDateStatus = (dateString: string): string => {
  const date = new Date(dateString);
  
  if (isPast(date)) {
    return '마감됨';
  }
  
  if (isToday(date)) {
    return '오늘 마감';
  }
  
  const daysLeft = differenceInDays(date, new Date());
  return `D-${daysLeft}일`;
};

export const isOverdue = (dateString: string): boolean => {
  const date = new Date(dateString);
  return isPast(date);
};

