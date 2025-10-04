import { z } from 'zod';

export const EnrollmentRequestSchema = z.object({
  courseId: z.string().uuid({ message: 'Course ID must be a valid UUID.' }),
});

export const EnrollmentResponseSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  learnerId: z.string().uuid(),
  enrolledAt: z.string(),
});

export const MyEnrollmentResponseSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  courseDescription: z.string(),
  instructorName: z.string(),
  category: z.string(),
  difficulty: z.string(),
  enrolledAt: z.string(),
});

export type EnrollmentRequest = z.infer<typeof EnrollmentRequestSchema>;
export type EnrollmentResponse = z.infer<typeof EnrollmentResponseSchema>;
export type MyEnrollmentResponse = z.infer<typeof MyEnrollmentResponseSchema>;


