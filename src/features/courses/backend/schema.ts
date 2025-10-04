import { z } from 'zod';

export const CourseListQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.string().optional(),
  sort: z.enum(['latest', 'popular']).optional().default('latest'),
  status: z
    .enum(['draft', 'published', 'archived'])
    .optional()
    .default('published'),
});

export const CourseParamsSchema = z.object({
  id: z.string().uuid({ message: 'Course ID must be a valid UUID.' }),
});

export const CourseResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  difficulty: z.string(),
  instructorName: z.string(),
  enrollmentCount: z.number().int().min(0),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string(),
});

export const CourseDetailResponseSchema = CourseResponseSchema.extend({
  instructorId: z.string().uuid(),
  status: z.enum(['draft', 'published', 'archived']),
  publishedAt: z.string().nullable(),
  isEnrolled: z.boolean(),
});

export const CreateCourseSchema = z.object({
  title: z.string().min(1, '코스 제목을 입력해주세요.').max(200, '제목은 200자 이하여야 합니다.'),
  description: z.string().min(1, '코스 설명을 입력해주세요.'),
  category: z.string().min(1, '카테고리를 선택해주세요.'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({ message: '난이도를 선택해주세요.' }),
  }),
});

export const UpdateCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  category: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

export const PublishCourseSchema = z.object({
  id: z.string().uuid(),
});

export type CourseListQuery = z.infer<typeof CourseListQuerySchema>;
export type CourseParams = z.infer<typeof CourseParamsSchema>;
export type CourseResponse = z.infer<typeof CourseResponseSchema>;
export type CourseDetailResponse = z.infer<typeof CourseDetailResponseSchema>;
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;


