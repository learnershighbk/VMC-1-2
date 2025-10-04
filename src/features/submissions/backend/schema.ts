import { z } from 'zod';

export const SubmitAssignmentSchema = z.object({
  assignmentId: z.string().uuid({ message: '유효한 과제 ID를 입력해주세요.' }),
  textContent: z.string().min(1, '제출 내용을 입력해주세요.').trim(),
  linkContent: z.string().url({ message: '올바른 URL 형식을 입력해주세요.' }).optional().or(z.literal('')),
});

export const SubmissionResultSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  version: z.number().int(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  late: z.boolean(),
  submittedAt: z.string(),
  contentText: z.string(),
  contentLink: z.string().nullable(),
});

export const AssignmentSubmissionItemSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  learnerId: z.string().uuid(),
  learnerName: z.string(),
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

export const AssignmentSubmissionListResponseSchema = z.object({
  assignment: z.object({
    id: z.string().uuid(),
    title: z.string(),
    status: z.enum(['draft', 'published', 'closed']),
    dueAt: z.string(),
  }),
  submissions: z.array(AssignmentSubmissionItemSchema),
});

export const ReviewSubmissionSchema = z.object({
  action: z.enum(['grade', 'requestResubmission']),
  score: z.number().int().min(0).max(100).optional(),
  feedback: z.string().min(1, '피드백은 필수입니다.').trim(),
}).refine(
  (data) => {
    if (data.action === 'grade') {
      return data.score !== undefined && data.score !== null;
    }
    return true;
  },
  {
    message: '채점 시 점수는 필수입니다.',
    path: ['score'],
  }
).refine(
  (data) => {
    if (data.action === 'requestResubmission') {
      return data.score === undefined;
    }
    return true;
  },
  {
    message: '재제출 요청 시 점수를 입력할 수 없습니다.',
    path: ['score'],
  }
);

export type SubmitAssignmentInput = z.infer<typeof SubmitAssignmentSchema>;
export type SubmissionResult = z.infer<typeof SubmissionResultSchema>;
export type AssignmentSubmissionItem = z.infer<typeof AssignmentSubmissionItemSchema>;
export type AssignmentSubmissionListResponse = z.infer<typeof AssignmentSubmissionListResponseSchema>;
export type ReviewSubmissionInput = z.infer<typeof ReviewSubmissionSchema>;

export const AssignmentGradeItemSchema = z.object({
  assignmentId: z.string().uuid(),
  assignmentTitle: z.string(),
  assignmentStatus: z.enum(['draft', 'published', 'closed']),
  dueAt: z.string(),
  scoreWeight: z.number(),
  
  submissionId: z.string().uuid().nullable(),
  submittedAt: z.string().nullable(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']).nullable(),
  late: z.boolean().nullable(),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  gradedAt: z.string().nullable(),
});

export const CourseGradeSummarySchema = z.object({
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  instructorName: z.string(),
  totalAssignments: z.number().int(),
  gradedAssignments: z.number().int(),
  totalScore: z.number().nullable(),
  maxPossibleScore: z.number(),
  assignments: z.array(AssignmentGradeItemSchema),
});

export const MyGradesResponseSchema = z.object({
  courses: z.array(CourseGradeSummarySchema),
});

export type AssignmentGradeItem = z.infer<typeof AssignmentGradeItemSchema>;
export type CourseGradeSummary = z.infer<typeof CourseGradeSummarySchema>;
export type MyGradesResponse = z.infer<typeof MyGradesResponseSchema>;

