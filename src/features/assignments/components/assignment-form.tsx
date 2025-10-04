'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateAssignmentSchema, type CreateAssignmentInput, type UpdateAssignmentInput } from '../backend/schema';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

interface AssignmentFormProps {
  mode: 'create' | 'edit';
  courseId: string;
  initialData?: Partial<UpdateAssignmentInput>;
  assignmentStatus?: 'draft' | 'published' | 'closed';
  onSubmit: (data: CreateAssignmentInput) => void;
  isLoading?: boolean;
}

export const AssignmentForm = ({
  mode,
  courseId,
  initialData,
  assignmentStatus,
  onSubmit,
  isLoading,
}: AssignmentFormProps) => {
  const formatToDatetimeLocal = (dateString: string | undefined): string => {
    if (!dateString) {
      return format(new Date(), "yyyy-MM-dd'T'HH:mm");
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return format(new Date(), "yyyy-MM-dd'T'HH:mm");
      }
      return format(date, "yyyy-MM-dd'T'HH:mm");
    } catch {
      return format(new Date(), "yyyy-MM-dd'T'HH:mm");
    }
  };

  const form = useForm<CreateAssignmentInput>({
    resolver: zodResolver(CreateAssignmentSchema),
    defaultValues: {
      courseId,
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      dueAt: formatToDatetimeLocal(initialData?.dueAt),
      scoreWeight: initialData?.scoreWeight ?? 10,
      allowLate: initialData?.allowLate ?? false,
      allowResubmission: initialData?.allowResubmission ?? false,
    },
  });

  const handleFormSubmit = (data: CreateAssignmentInput) => {
    let formattedDueAt = data.dueAt;
    
    if (data.dueAt.length === 16 && !data.dueAt.includes('Z')) {
      const date = new Date(data.dueAt);
      if (!isNaN(date.getTime())) {
        formattedDueAt = date.toISOString();
      }
    }
    
    // published 상태일 때는 title과 description만 전송
    let formattedData: CreateAssignmentInput;
    if (assignmentStatus === 'published') {
      formattedData = {
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        // 다른 필드들은 제외
      };
    } else {
      formattedData = {
        ...data,
        dueAt: formattedDueAt,
      };
    }
    
    onSubmit(formattedData);
  };

  // published 상태일 때 일부 필드 비활성화
  const isPublished = assignmentStatus === 'published';
  const isClosed = assignmentStatus === 'closed';
  const isReadOnly = isPublished || isClosed;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>과제 제목 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="예: 1주차 과제 - React 컴포넌트 만들기"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>과제 설명 *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="과제에 대한 자세한 설명을 입력해주세요..."
                  rows={8}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dueAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>마감일 *</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    {...field}
                    disabled={isReadOnly}
                  />
                </FormControl>
                {isPublished && (
                  <FormDescription className="text-amber-600">
                    게시된 과제는 마감일을 수정할 수 없습니다.
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scoreWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>점수 비중 (%) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="10"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <FormDescription>
                  {isPublished 
                    ? "게시된 과제는 점수 비중을 수정할 수 없습니다."
                    : "코스 전체 점수에서 차지하는 비중 (0-100)"
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="allowLate"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>지각 제출 허용</FormLabel>
                  <FormDescription>
                    {isPublished 
                      ? "게시된 과제는 지각 제출 설정을 수정할 수 없습니다."
                      : "마감일이 지난 후에도 제출을 허용합니다"
                    }
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="allowResubmission"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isReadOnly}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>재제출 허용</FormLabel>
                  <FormDescription>
                    {isPublished 
                      ? "게시된 과제는 재제출 설정을 수정할 수 없습니다."
                      : "학습자가 과제를 여러 번 제출할 수 있도록 허용합니다"
                    }
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '저장 중...' : mode === 'create' ? '과제 생성' : '과제 수정'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

