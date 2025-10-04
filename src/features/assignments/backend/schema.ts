import { z } from 'zod';

export const AssignmentParamsSchema = z.object({
  id: z.string().uuid({ message: 'Assignment ID must be a valid UUID.' }),
});

export const SubmissionDetailSchema = z.object({
  id: z.string().uuid(),
  version: z.number().int(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  late: z.boolean(),
  submittedAt: z.string(),
  contentText: z.string(),
  contentLink: z.string().nullable(),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  gradedAt: z.string().nullable(),
});

export const AssignmentDetailResponseSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.enum(['draft', 'published', 'closed']),
  dueAt: z.string(),
  scoreWeight: z.number(),
  allowLate: z.boolean(),
  allowResubmission: z.boolean(),
  publishedAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  submission: SubmissionDetailSchema.nullable(),
});

export const CreateAssignmentSchema = z.object({
  courseId: z.string().uuid({ message: 'Course ID must be a valid UUID.' }),
  title: z.string().min(1, '과제 제목을 입력해주세요.').max(200, '제목은 200자 이하여야 합니다.'),
  description: z.string().min(1, '과제 설명을 입력해주세요.'),
  dueAt: z.string().refine(
    (val) => {
      const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      return datetimeLocalRegex.test(val) || iso8601Regex.test(val) || !isNaN(Date.parse(val));
    },
    { message: '올바른 마감일을 입력해주세요.' }
  ),
  scoreWeight: z.number().min(0).max(100, '점수 비중은 0-100 사이여야 합니다.'),
  allowLate: z.boolean().default(false),
  allowResubmission: z.boolean().default(false),
});

export const UpdateAssignmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  dueAt: z.string().refine(
    (val) => {
      const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      return datetimeLocalRegex.test(val) || iso8601Regex.test(val) || !isNaN(Date.parse(val));
    },
    { message: '올바른 마감일을 입력해주세요.' }
  ).optional(),
  scoreWeight: z.number().min(0).max(100).optional(),
  allowLate: z.boolean().optional(),
  allowResubmission: z.boolean().optional(),
});

export type AssignmentParams = z.infer<typeof AssignmentParamsSchema>;
export type SubmissionDetail = z.infer<typeof SubmissionDetailSchema>;
export type AssignmentDetailResponse = z.infer<typeof AssignmentDetailResponseSchema>;
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentSchema>;

