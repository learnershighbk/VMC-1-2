"use client";

import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type SuccessDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
};

export const SuccessDialog = ({
  open,
  onClose,
  title = '성공',
  message,
}: SuccessDialogProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
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
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">닫기</span>
        </button>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <p className="text-sm text-slate-600">{message}</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

