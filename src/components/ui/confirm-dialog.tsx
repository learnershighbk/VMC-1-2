"use client";

import { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
};

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = '확인',
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !isLoading) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose, isLoading]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={isLoading ? undefined : onClose}
    >
      <div
        className={cn(
          "relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl",
          "animate-in fade-in-0 zoom-in-95"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">닫기</span>
        </button>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className={cn(
              "h-5 w-5",
              variant === 'destructive' ? 'text-rose-500' : 'text-amber-500'
            )} />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <p className="text-sm text-slate-600">{message}</p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={variant}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

