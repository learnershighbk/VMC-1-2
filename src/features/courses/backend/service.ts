import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { courseErrorCodes } from './error';
import type { CourseListQuery, CreateCourseInput, UpdateCourseInput } from './schema';
import { failure, success, type HandlerResult } from '@/backend/http/response';

type ServiceResult<T> = HandlerResult<T, string, unknown>;

type CourseRow = Database['public']['Tables']['courses']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface CourseListItem {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  instructorName: string;
  enrollmentCount: number;
  status: string;
  createdAt: string;
}

export interface CourseDetail extends CourseListItem {
  instructorId: string;
  publishedAt: string | null;
  isEnrolled: boolean;
}

export const listCourses = async (
  supabase: SupabaseClient<Database>,
  query: CourseListQuery,
  userId?: string
): Promise<ServiceResult<CourseListItem[]>> => {
  try {
    let dbQuery = supabase
      .from('courses')
      .select(
        `
        *,
        instructor:profiles!courses_instructor_id_fkey(full_name),
        enrollments:course_enrollments(count)
      `
      )
      .eq('status', query.status);

    if (query.search) {
      dbQuery = dbQuery.or(
        `title.ilike.%${query.search}%,description.ilike.%${query.search}%`
      );
    }

    if (query.category) {
      dbQuery = dbQuery.eq('category', query.category);
    }

    if (query.difficulty) {
      dbQuery = dbQuery.eq('difficulty', query.difficulty);
    }

    if (query.sort === 'latest') {
      dbQuery = dbQuery.order('created_at', { ascending: false });
    }

    const { data, error } = await dbQuery;

    if (error) {
      return failure(500, courseErrorCodes.fetchError, error.message);
    }

    if (!data) {
      return success([]);
    }

    const courses: CourseListItem[] = data.map((course: any) => {
      const instructor = Array.isArray(course.instructor)
        ? course.instructor[0]
        : course.instructor;

      const enrollments = Array.isArray(course.enrollments)
        ? course.enrollments
        : [];

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        instructorName: instructor?.full_name ?? 'Unknown',
        enrollmentCount: enrollments.length,
        status: course.status,
        createdAt: course.created_at,
      };
    });

    if (query.sort === 'popular') {
      courses.sort((a, b) => b.enrollmentCount - a.enrollmentCount);
    }

    return success(courses);
  } catch (err) {
    return failure(
      500,
      courseErrorCodes.fetchError,
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
};

export const getCourseDetail = async (
  supabase: SupabaseClient<Database>,
  courseId: string,
  userId: string
): Promise<ServiceResult<CourseDetail>> => {
  try {
    const { data: course, error: courseError } = await (supabase
      .from('courses') as any)
      .select(
        `
        *,
        instructor:profiles!courses_instructor_id_fkey(full_name),
        enrollments:course_enrollments(count)
      `
      )
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return failure(
        404,
        courseErrorCodes.notFound,
        'Course not found or access denied'
      );
    }

    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('learner_id', userId)
      .single();

    const courseData = course as any;
    const instructor = Array.isArray(courseData.instructor)
      ? courseData.instructor[0]
      : courseData.instructor;

    const enrollments = Array.isArray(courseData.enrollments)
      ? courseData.enrollments
      : [];

    const courseDetail: CourseDetail = {
      id: courseData.id,
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      difficulty: courseData.difficulty,
      instructorName: instructor?.full_name ?? 'Unknown',
      instructorId: courseData.instructor_id,
      status: courseData.status,
      publishedAt: courseData.published_at,
      enrollmentCount: enrollments.length,
      createdAt: courseData.created_at,
      isEnrolled: !!enrollment,
    };

    return success(courseDetail);
  } catch (err) {
    return failure(
      500,
      courseErrorCodes.fetchError,
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
};

export const createCourse = async (
  supabase: SupabaseClient<Database>,
  instructorId: string,
  input: CreateCourseInput
): Promise<ServiceResult<CourseDetail>> => {
  try {
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('role')
      .eq('id', instructorId)
      .single();

    if (!profile || profile.role !== 'instructor') {
      return failure(
        403,
        courseErrorCodes.unauthorizedAccess,
        'Only instructors can create courses'
      );
    }

    const { data: course, error: insertError } = await (supabase
      .from('courses') as any)
      .insert({
        instructor_id: instructorId,
        title: input.title,
        description: input.description,
        category: input.category,
        difficulty: input.difficulty,
        status: 'draft',
      })
      .select(
        `
        *,
        instructor:profiles!courses_instructor_id_fkey(full_name)
      `
      )
      .single();

    if (insertError || !course) {
      return failure(
        500,
        courseErrorCodes.createError,
        insertError?.message ?? 'Failed to create course'
      );
    }

    const courseData = course as any;
    const instructor = Array.isArray(courseData.instructor)
      ? courseData.instructor[0]
      : courseData.instructor;

    const courseDetail: CourseDetail = {
      id: courseData.id,
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      difficulty: courseData.difficulty,
      instructorName: instructor?.full_name ?? 'Unknown',
      instructorId: courseData.instructor_id,
      status: courseData.status,
      publishedAt: courseData.published_at,
      enrollmentCount: 0,
      createdAt: courseData.created_at,
      isEnrolled: false,
    };

    return success(courseDetail);
  } catch (err) {
    return failure(
      500,
      courseErrorCodes.createError,
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
};

export const updateCourse = async (
  supabase: SupabaseClient<Database>,
  courseId: string,
  instructorId: string,
  input: UpdateCourseInput
): Promise<ServiceResult<CourseDetail>> => {
  try {
    const { data: existingCourse } = await (supabase
      .from('courses') as any)
      .select('instructor_id')
      .eq('id', courseId)
      .single();

    if (!existingCourse) {
      return failure(404, courseErrorCodes.notFound, 'Course not found');
    }

    if (existingCourse.instructor_id !== instructorId) {
      return failure(
        403,
        courseErrorCodes.unauthorizedAccess,
        'You can only update your own courses'
      );
    }

    const { data: course, error: updateError } = await (supabase
      .from('courses') as any)
      .update({
        ...(input.title && { title: input.title }),
        ...(input.description && { description: input.description }),
        ...(input.category && { category: input.category }),
        ...(input.difficulty && { difficulty: input.difficulty }),
      })
      .eq('id', courseId)
      .select(
        `
        *,
        instructor:profiles!courses_instructor_id_fkey(full_name),
        enrollments:course_enrollments(count)
      `
      )
      .single();

    if (updateError || !course) {
      return failure(
        500,
        courseErrorCodes.updateError,
        updateError?.message ?? 'Failed to update course'
      );
    }

    const courseData = course as any;
    const instructor = Array.isArray(courseData.instructor)
      ? courseData.instructor[0]
      : courseData.instructor;

    const enrollments = Array.isArray(courseData.enrollments)
      ? courseData.enrollments
      : [];

    const courseDetail: CourseDetail = {
      id: courseData.id,
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      difficulty: courseData.difficulty,
      instructorName: instructor?.full_name ?? 'Unknown',
      instructorId: courseData.instructor_id,
      status: courseData.status,
      publishedAt: courseData.published_at,
      enrollmentCount: enrollments.length,
      createdAt: courseData.created_at,
      isEnrolled: false,
    };

    return success(courseDetail);
  } catch (err) {
    return failure(
      500,
      courseErrorCodes.updateError,
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
};

export const publishCourse = async (
  supabase: SupabaseClient<Database>,
  courseId: string,
  instructorId: string
): Promise<ServiceResult<CourseDetail>> => {
  try {
    const { data: existingCourse } = await (supabase
      .from('courses') as any)
      .select('instructor_id, status')
      .eq('id', courseId)
      .single();

    if (!existingCourse) {
      return failure(404, courseErrorCodes.notFound, 'Course not found');
    }

    if (existingCourse.instructor_id !== instructorId) {
      return failure(
        403,
        courseErrorCodes.unauthorizedAccess,
        'You can only publish your own courses'
      );
    }

    if (existingCourse.status === 'published') {
      return failure(
        400,
        courseErrorCodes.validationError,
        'Course is already published'
      );
    }

    const { data: course, error: updateError } = await (supabase
      .from('courses') as any)
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', courseId)
      .select(
        `
        *,
        instructor:profiles!courses_instructor_id_fkey(full_name),
        enrollments:course_enrollments(count)
      `
      )
      .single();

    if (updateError || !course) {
      return failure(
        500,
        courseErrorCodes.updateError,
        updateError?.message ?? 'Failed to publish course'
      );
    }

    const courseData = course as any;
    const instructor = Array.isArray(courseData.instructor)
      ? courseData.instructor[0]
      : courseData.instructor;

    const enrollments = Array.isArray(courseData.enrollments)
      ? courseData.enrollments
      : [];

    const courseDetail: CourseDetail = {
      id: courseData.id,
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      difficulty: courseData.difficulty,
      instructorName: instructor?.full_name ?? 'Unknown',
      instructorId: courseData.instructor_id,
      status: courseData.status,
      publishedAt: courseData.published_at,
      enrollmentCount: enrollments.length,
      createdAt: courseData.created_at,
      isEnrolled: false,
    };

    return success(courseDetail);
  } catch (err) {
    return failure(
      500,
      courseErrorCodes.updateError,
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
};

export const deleteCourse = async (
  supabase: SupabaseClient<Database>,
  courseId: string,
  instructorId: string
): Promise<ServiceResult<void>> => {
  try {
    const { data: existingCourse } = await (supabase
      .from('courses') as any)
      .select('instructor_id')
      .eq('id', courseId)
      .single();

    if (!existingCourse) {
      return failure(404, courseErrorCodes.notFound, 'Course not found');
    }

    if (existingCourse.instructor_id !== instructorId) {
      return failure(
        403,
        courseErrorCodes.unauthorizedAccess,
        'You can only delete your own courses'
      );
    }

    const { error: deleteError } = await (supabase
      .from('courses') as any)
      .delete()
      .eq('id', courseId);

    if (deleteError) {
      return failure(
        500,
        courseErrorCodes.deleteError,
        deleteError.message
      );
    }

    return success(undefined);
  } catch (err) {
    return failure(
      500,
      courseErrorCodes.deleteError,
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
};

export const listMyCourses = async (
  supabase: SupabaseClient<Database>,
  instructorId: string
): Promise<ServiceResult<CourseListItem[]>> => {
  try {
    const { data, error } = await (supabase
      .from('courses') as any)
      .select(
        `
        *,
        instructor:profiles!courses_instructor_id_fkey(full_name),
        enrollments:course_enrollments(count)
      `
      )
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false });

    if (error) {
      return failure(500, courseErrorCodes.fetchError, error.message);
    }

    if (!data) {
      return success([]);
    }

    const courses: CourseListItem[] = data.map((course: any) => {
      const instructor = Array.isArray(course.instructor)
        ? course.instructor[0]
        : course.instructor;

      const enrollments = Array.isArray(course.enrollments)
        ? course.enrollments
        : [];

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        instructorName: instructor?.full_name ?? 'Unknown',
        enrollmentCount: enrollments.length,
        status: course.status,
        createdAt: course.created_at,
      };
    });

    return success(courses);
  } catch (err) {
    return failure(
      500,
      courseErrorCodes.fetchError,
      err instanceof Error ? err.message : 'Unknown error'
    );
  }
};


