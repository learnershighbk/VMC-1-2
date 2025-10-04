"use client";

import { cn } from '@/lib/utils';
import { BookOpen, GraduationCap } from 'lucide-react';

type Role = 'learner' | 'instructor';

type RoleSelectorProps = {
  value: Role | null;
  onChange: (role: Role) => void;
  disabled?: boolean;
};

export const RoleSelector = ({ value, onChange, disabled }: RoleSelectorProps) => {
  const roles = [
    {
      value: 'learner' as const,
      label: '학습자',
      description: '코스를 수강하고 과제를 제출합니다',
      icon: BookOpen,
    },
    {
      value: 'instructor' as const,
      label: '강사',
      description: '코스를 만들고 학생을 관리합니다',
      icon: GraduationCap,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {roles.map((role) => {
        const Icon = role.icon;
        const isSelected = value === role.value;
        
        return (
          <button
            key={role.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(role.value)}
            className={cn(
              'flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition',
              'hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500',
              isSelected ? 'border-slate-900 bg-slate-50' : 'border-slate-200',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <Icon className={cn('h-8 w-8', isSelected ? 'text-slate-900' : 'text-slate-500')} />
            <div>
              <h3 className="font-semibold text-slate-900">{role.label}</h3>
              <p className="text-sm text-slate-600">{role.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

