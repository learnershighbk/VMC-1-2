import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { enrollmentErrorCodes } from './error';
import { failure, success, type HandlerResult } from '@/backend/http/response';

type ServiceResult<T> = HandlerResult<T, string, unknown>;

export interface EnrollmentResult {
  id: string;
  courseId: string;
  learnerId: string;
  enrolledAt: string;
}

export interface MyEnrollmentItem {
  id: string;
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  instructorName: string;
  category: string;
  difficulty: string;
  enrolledAt: string;
}

export const createEnrollment = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  courseId: string
): Promise<ServiceResult<EnrollmentResult>> => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return failure(
        403,
        enrollmentErrorCodes.unauthorizedAccess,
        'User profile not found'
      );
    }

    const profileData = profile as any;
    if (profileData.role !== 'learner') {
      return failure(
        403,
        enrollmentErrorCodes.notLearner,
        'Only learners can enroll in courses'
      );
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, status')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return failure(
        404,
        enrollmentErrorCodes.createError,
        'Course not found'
      );
    }

    const courseData = course as any;
    if (courseData.status !== 'published') {
      return failure(
        400,
        enrollmentErrorCodes.courseNotPublished,
        'Cannot enroll in unpublished course'
      );
    }

    const { data: existingEnrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('learner_id', userId)
      .single();

    if (existingEnrollment) {
      return failure(
        409,
        enrollmentErrorCodes.duplicateEnrollment,
        'Already enrolled in this course'
      );
    }

    const { data: enrollment, error: enrollmentError } = await (supabase
      .from('course_enrollments') as any)
      .insert({
        course_id: courseId,
        learner_id: userId,
      })
      .select('id, course_id, learner_id, enrolled_at')
      .single();

    if (enrollmentError || !enrollment) {
      return failure(
        500,
        enrollmentErrorCodes.createError,
        enrollmentError?.message ?? 'Failed to create enrollment'
      );
    }

    return success({
      id: enrollment.id,
      courseId: enrollment.course_id,
      learnerId: enrollment.learner_id,
      enrolledAt: enrollment.enrolled_at,
    });
  } catch (err) {
    return failure(
      500,
      enrollmentErrorCodes.createError,
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
};

export const getMyEnrollments = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ServiceResult<MyEnrollmentItem[]>> => {
  try {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(
        `
        id,
        course_id,
        enrolled_at,
        courses (
          title,
          description,
          category,
          difficulty,
          instructor:profiles!courses_instructor_id_fkey(full_name)
        )
      `
      )
      .eq('learner_id', userId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      return failure(500, enrollmentErrorCodes.fetchError, error.message);
    }

    if (!data) {
      return success([]);
    }

    const enrollments: MyEnrollmentItem[] = data.map((enrollment: any) => {
      const course = Array.isArray(enrollment.courses)
        ? enrollment.courses[0]
        : enrollment.courses;

      const instructor = course?.instructor
        ? Array.isArray(course.instructor)
          ? course.instructor[0]
          : course.instructor
        : null;

      return {
        id: enrollment.id,
        courseId: enrollment.course_id,
        courseTitle: course?.title ?? 'Unknown',
        courseDescription: course?.description ?? '',
        instructorName: instructor?.full_name ?? 'Unknown',
        category: course?.category ?? 'Unknown',
        difficulty: course?.difficulty ?? 'Unknown',
        enrolledAt: enrollment.enrolled_at,
      };
    });

    return success(enrollments);
  } catch (err) {
    return failure(
      500,
      enrollmentErrorCodes.fetchError,
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
};


