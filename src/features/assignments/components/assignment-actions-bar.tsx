'use client';

import { Button } from '@/components/ui/button';
import { Trash2, Send, Lock } from 'lucide-react';
import type { AssignmentDetailResponse } from '../lib/dto';

interface AssignmentActionsBarProps {
  assignment: AssignmentDetailResponse;
  onPublish: () => void;
  onClose: () => void;
  onDelete: () => void;
  isPublishing?: boolean;
  isClosing?: boolean;
  isDeleting?: boolean;
}

export function AssignmentActionsBar({
  assignment,
  onPublish,
  onClose,
  onDelete,
  isPublishing = false,
  isClosing = false,
  isDeleting = false,
}: AssignmentActionsBarProps) {
  const isLoading = isPublishing || isClosing || isDeleting;
  const isDraft = assignment.status === 'draft';
  const isPublished = assignment.status === 'published';
  const isClosed = assignment.status === 'closed';

  return (
    <div className="flex items-center gap-2">
      {isDraft && (
        <>
          <Button
            onClick={onPublish}
            disabled={isLoading}
            size="sm"
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {isPublishing ? '게시 중...' : '게시하기'}
          </Button>
          <Button
            onClick={onDelete}
            disabled={isLoading}
            size="sm"
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? '삭제 중...' : '삭제'}
          </Button>
        </>
      )}

      {isPublished && (
        <Button
          onClick={onClose}
          disabled={isLoading}
          size="sm"
          variant="secondary"
          className="flex items-center gap-2"
        >
          <Lock className="h-4 w-4" />
          {isClosing ? '마감 중...' : '마감하기'}
        </Button>
      )}

      {isClosed && (
        <div className="px-3 py-1.5 text-sm font-medium text-muted-foreground bg-muted rounded-md">
          마감됨
        </div>
      )}
    </div>
  );
}

