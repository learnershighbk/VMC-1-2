'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateCourseSchema, type CreateCourseInput, type UpdateCourseInput } from '../backend/schema';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CourseFormProps {
  mode: 'create' | 'edit';
  initialData?: UpdateCourseInput & { difficulty?: 'beginner' | 'intermediate' | 'advanced' };
  onSubmit: (data: CreateCourseInput) => void;
  isLoading?: boolean;
}

const CATEGORIES = [
  { value: 'programming', label: '프로그래밍' },
  { value: 'design', label: '디자인' },
  { value: 'business', label: '비즈니스' },
  { value: 'marketing', label: '마케팅' },
  { value: 'language', label: '언어' },
  { value: 'etc', label: '기타' },
];

const DIFFICULTIES = [
  { value: 'beginner', label: '초급' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '고급' },
];

export const CourseForm = ({ mode, initialData, onSubmit, isLoading }: CourseFormProps) => {
  const form = useForm<CreateCourseInput>({
    resolver: zodResolver(CreateCourseSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      category: initialData?.category ?? '',
      difficulty: initialData?.difficulty ?? 'beginner',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>코스 제목 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="예: React 완벽 마스터하기"
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
              <FormLabel>코스 설명 *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="코스에 대한 자세한 설명을 입력해주세요..."
                  rows={6}
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
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>카테고리 *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>난이도 *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="난이도 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DIFFICULTIES.map((difficulty) => (
                      <SelectItem key={difficulty.value} value={difficulty.value}>
                        {difficulty.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
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
            {isLoading ? '저장 중...' : mode === 'create' ? '코스 생성' : '코스 수정'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

