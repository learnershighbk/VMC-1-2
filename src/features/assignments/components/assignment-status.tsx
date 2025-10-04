'use client';

import { Badge } from '@/components/ui/badge';
import { match } from 'ts-pattern';

interface AssignmentStatusProps {
  status: 'draft' | 'published' | 'closed';
}

export const AssignmentStatus = ({ status }: AssignmentStatusProps) => {
  const { label, variant } = match(status)
    .with('draft', () => ({ label: '작성 중', variant: 'secondary' as const }))
    .with('published', () => ({ label: '진행 중', variant: 'default' as const }))
    .with('closed', () => ({ label: '마감됨', variant: 'destructive' as const }))
    .exhaustive();

  return <Badge variant={variant}>{label}</Badge>;
};

