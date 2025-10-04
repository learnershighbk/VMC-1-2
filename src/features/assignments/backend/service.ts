import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { assignmentErrorCodes } from './error';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { CreateAssignmentInput, UpdateAssignmentInput } from './schema';

type ServiceResult<T> = HandlerResult<T, string, unknown>;

export interface AssignmentDetail {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  description: string;
  status: string;
  dueAt: string;
  scoreWeight: number;
  allowLate: boolean;
  allowResubmission: boolean;
  publishedAt: string | null;
  closedAt: string | null;
  submission: SubmissionDetail | null;
}

export interface SubmissionDetail {
  id: string;
  version: number;
  status: string;
  late: boolean;
  submittedAt: string;
  contentText: string;
  contentLink: string | null;
  score: number | null;
  feedback: string | null;
  gradedAt: string | null;
}

export const getAssignmentDetail = async (
  supabase: SupabaseClient<Database>,
  assignmentId: string,
  userId: string
): Promise<ServiceResult<AssignmentDetail>> => {
  try {
    const { data: assignment, error: assignmentError } = await (supabase
      .from('assignments') as any)
      .select(`
        *,
        course:courses(id, title, instructor_id)
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return failure(
        404,
        assignmentErrorCodes.notFound,
        '과제를 찾을 수 없습니다.'
      );
    }

    const assignmentData = assignment as any;
    const course = assignmentData.course;

    const isInstructor = course.instructor_id === userId;

    if (!isInstructor) {
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', course.id)
        .eq('learner_id', userId)
        .single();

      if (!enrollment) {
        return failure(
          403,
          assignmentErrorCodes.notEnrolled,
          '수강 중인 코스만 열람 가능합니다.'
        );
      }

      if (assignmentData.status === 'draft') {
        return failure(
          404,
          assignmentErrorCodes.notPublished,
          '아직 공개되지 않은 과제입니다.'
        );
      }
    }

    const { data: submissionData } = await (supabase
      .from('assignment_submissions') as any)
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('learner_id', userId)
      .eq('is_latest', true)
      .single();

    const submission = submissionData as any;

    const submissionDetail: SubmissionDetail | null = submission
      ? {
          id: submission.id,
          version: submission.version,
          status: submission.status,
          late: submission.late,
          submittedAt: submission.submitted_at,
          contentText: submission.content_text,
          contentLink: submission.content_link,
          score: submission.score ? Number(submission.score) : null,
          feedback: submission.feedback,
          gradedAt: submission.graded_at,
        }
      : null;

    const assignmentDetail: AssignmentDetail = {
      id: assignmentData.id,
      courseId: course.id,
      courseTitle: course.title,
      title: assignmentData.title,
      description: assignmentData.description,
      status: assignmentData.status,
      dueAt: assignmentData.due_at,
      scoreWeight: Number(assignmentData.score_weight),
      allowLate: assignmentData.allow_late,
      allowResubmission: assignmentData.allow_resubmission,
      publishedAt: assignmentData.published_at,
      closedAt: assignmentData.closed_at,
      submission: submissionDetail,
    };

    return success(assignmentDetail);
  } catch (err) {
    return failure(
      500,
      assignmentErrorCodes.fetchError,
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    );
  }
};

export const createAssignment = async (
  supabase: SupabaseClient<Database>,
  instructorId: string,
  input: CreateAssignmentInput
): Promise<ServiceResult<AssignmentDetail>> => {
  try {
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, title, instructor_id')
      .eq('id', input.courseId)
      .single();

    if (courseError || !courseData) {
      return failure(
        404,
        assignmentErrorCodes.courseNotFound,
        '코스를 찾을 수 없습니다.'
      );
    }

    const course = courseData as { id: string; title: string; instructor_id: string };

    if (course.instructor_id !== instructorId) {
      return failure(
        403,
        assignmentErrorCodes.unauthorizedAccess,
        '본인의 코스에만 과제를 생성할 수 있습니다.'
      );
    }

    const { data: assignment, error: insertError } = await (supabase
      .from('assignments') as any)
      .insert({
        course_id: input.courseId,
        title: input.title,
        description: input.description,
        due_at: input.dueAt,
        score_weight: input.scoreWeight,
        allow_late: input.allowLate,
        allow_resubmission: input.allowResubmission,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError || !assignment) {
      return failure(
        500,
        assignmentErrorCodes.createError,
        insertError?.message ?? '과제 생성에 실패했습니다.'
      );
    }

    const assignmentDetail: AssignmentDetail = {
      id: assignment.id,
      courseId: course.id,
      courseTitle: course.title,
      title: assignment.title,
      description: assignment.description,
      status: assignment.status,
      dueAt: assignment.due_at,
      scoreWeight: Number(assignment.score_weight),
      allowLate: assignment.allow_late,
      allowResubmission: assignment.allow_resubmission,
      publishedAt: assignment.published_at,
      closedAt: assignment.closed_at,
      submission: null,
    };

    return success(assignmentDetail);
  } catch (err) {
    return failure(
      500,
      assignmentErrorCodes.createError,
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    );
  }
};

export const updateAssignment = async (
  supabase: SupabaseClient<Database>,
  assignmentId: string,
  instructorId: string,
  input: UpdateAssignmentInput
): Promise<ServiceResult<AssignmentDetail>> => {
  try {
    const { data: assignment } = await (supabase
      .from('assignments') as any)
      .select('*, course:courses(id, title, instructor_id)')
      .eq('id', assignmentId)
      .single();

    if (!assignment) {
      return failure(
        404,
        assignmentErrorCodes.notFound,
        '과제를 찾을 수 없습니다.'
      );
    }

    const assignmentData = assignment as any;
    const course = assignmentData.course;

    if (course.instructor_id !== instructorId) {
      return failure(
        403,
        assignmentErrorCodes.unauthorizedAccess,
        '본인의 과제만 수정할 수 있습니다.'
      );
    }

    if (assignmentData.status === 'closed') {
      return failure(
        400,
        assignmentErrorCodes.cannotEditClosed,
        '마감된 과제는 수정할 수 없습니다.'
      );
    }

    let updatePayload: any = {};

    if (assignmentData.status === 'published') {
      if (input.title) updatePayload.title = input.title;
      if (input.description) updatePayload.description = input.description;

      if (input.dueAt || input.scoreWeight !== undefined || input.allowLate !== undefined || input.allowResubmission !== undefined) {
        return failure(
          400,
          assignmentErrorCodes.publishedFieldRestriction,
          '게시된 과제는 제목과 설명만 수정할 수 있습니다.'
        );
      }
    } else {
      updatePayload = {
        ...(input.title && { title: input.title }),
        ...(input.description && { description: input.description }),
        ...(input.dueAt && { due_at: input.dueAt }),
        ...(input.scoreWeight !== undefined && { score_weight: input.scoreWeight }),
        ...(input.allowLate !== undefined && { allow_late: input.allowLate }),
        ...(input.allowResubmission !== undefined && { allow_resubmission: input.allowResubmission }),
      };
    }

    const { data: updated, error: updateError } = await (supabase
      .from('assignments') as any)
      .update(updatePayload)
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError || !updated) {
      return failure(
        500,
        assignmentErrorCodes.updateError,
        updateError?.message ?? '과제 수정에 실패했습니다.'
      );
    }

    const assignmentDetail: AssignmentDetail = {
      id: updated.id,
      courseId: course.id,
      courseTitle: course.title,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      dueAt: updated.due_at,
      scoreWeight: Number(updated.score_weight),
      allowLate: updated.allow_late,
      allowResubmission: updated.allow_resubmission,
      publishedAt: updated.published_at,
      closedAt: updated.closed_at,
      submission: null,
    };

    return success(assignmentDetail);
  } catch (err) {
    return failure(
      500,
      assignmentErrorCodes.updateError,
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    );
  }
};

export const publishAssignment = async (
  supabase: SupabaseClient<Database>,
  assignmentId: string,
  instructorId: string
): Promise<ServiceResult<AssignmentDetail>> => {
  try {
    const { data: assignment } = await (supabase
      .from('assignments') as any)
      .select('*, course:courses(id, title, instructor_id)')
      .eq('id', assignmentId)
      .single();

    if (!assignment) {
      return failure(
        404,
        assignmentErrorCodes.notFound,
        '과제를 찾을 수 없습니다.'
      );
    }

    const assignmentData = assignment as any;
    const course = assignmentData.course;

    if (course.instructor_id !== instructorId) {
      return failure(
        403,
        assignmentErrorCodes.unauthorizedAccess,
        '본인의 과제만 게시할 수 있습니다.'
      );
    }

    if (assignmentData.status === 'published') {
      return failure(
        400,
        assignmentErrorCodes.validationError,
        '이미 게시된 과제입니다.'
      );
    }

    if (!assignmentData.title || !assignmentData.description || !assignmentData.due_at || assignmentData.score_weight == null) {
      return failure(
        400,
        assignmentErrorCodes.missingRequiredFields,
        '필수 항목을 모두 입력해주세요.'
      );
    }

    const dueDate = new Date(assignmentData.due_at);
    const now = new Date();
    if (dueDate <= now) {
      return failure(
        400,
        assignmentErrorCodes.pastDueDate,
        '마감일이 과거입니다. 마감일을 수정한 후 게시해주세요.'
      );
    }

    const { data: updated, error: updateError } = await (supabase
      .from('assignments') as any)
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError || !updated) {
      return failure(
        500,
        assignmentErrorCodes.updateError,
        updateError?.message ?? '과제 게시에 실패했습니다.'
      );
    }

    const assignmentDetail: AssignmentDetail = {
      id: updated.id,
      courseId: course.id,
      courseTitle: course.title,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      dueAt: updated.due_at,
      scoreWeight: Number(updated.score_weight),
      allowLate: updated.allow_late,
      allowResubmission: updated.allow_resubmission,
      publishedAt: updated.published_at,
      closedAt: updated.closed_at,
      submission: null,
    };

    return success(assignmentDetail);
  } catch (err) {
    return failure(
      500,
      assignmentErrorCodes.updateError,
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    );
  }
};

export const closeAssignment = async (
  supabase: SupabaseClient<Database>,
  assignmentId: string,
  instructorId: string
): Promise<ServiceResult<AssignmentDetail>> => {
  try {
    const { data: assignment } = await (supabase
      .from('assignments') as any)
      .select('*, course:courses(id, title, instructor_id)')
      .eq('id', assignmentId)
      .single();

    if (!assignment) {
      return failure(
        404,
        assignmentErrorCodes.notFound,
        '과제를 찾을 수 없습니다.'
      );
    }

    const assignmentData = assignment as any;
    const course = assignmentData.course;

    if (course.instructor_id !== instructorId) {
      return failure(
        403,
        assignmentErrorCodes.unauthorizedAccess,
        '본인의 과제만 마감할 수 있습니다.'
      );
    }

    if (assignmentData.status === 'closed') {
      return failure(
        400,
        assignmentErrorCodes.validationError,
        '이미 마감된 과제입니다.'
      );
    }

    const { data: updated, error: updateError } = await (supabase
      .from('assignments') as any)
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError || !updated) {
      return failure(
        500,
        assignmentErrorCodes.updateError,
        updateError?.message ?? '과제 마감에 실패했습니다.'
      );
    }

    const assignmentDetail: AssignmentDetail = {
      id: updated.id,
      courseId: course.id,
      courseTitle: course.title,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      dueAt: updated.due_at,
      scoreWeight: Number(updated.score_weight),
      allowLate: updated.allow_late,
      allowResubmission: updated.allow_resubmission,
      publishedAt: updated.published_at,
      closedAt: updated.closed_at,
      submission: null,
    };

    return success(assignmentDetail);
  } catch (err) {
    return failure(
      500,
      assignmentErrorCodes.updateError,
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    );
  }
};

export const deleteAssignment = async (
  supabase: SupabaseClient<Database>,
  assignmentId: string,
  instructorId: string
): Promise<ServiceResult<void>> => {
  try {
    const { data: assignment } = await (supabase
      .from('assignments') as any)
      .select('*, course:courses(id, instructor_id)')
      .eq('id', assignmentId)
      .single();

    if (!assignment) {
      return failure(
        404,
        assignmentErrorCodes.notFound,
        '과제를 찾을 수 없습니다.'
      );
    }

    const assignmentData = assignment as any;
    const course = assignmentData.course;

    if (course.instructor_id !== instructorId) {
      return failure(
        403,
        assignmentErrorCodes.unauthorizedAccess,
        '본인의 과제만 삭제할 수 있습니다.'
      );
    }

    if (assignmentData.status === 'closed') {
      return failure(
        400,
        assignmentErrorCodes.cannotDeleteClosed,
        '마감된 과제는 삭제할 수 없습니다.'
      );
    }

    const { data: submissions, error: submissionError } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .limit(1);

    if (submissionError) {
      return failure(500, assignmentErrorCodes.fetchError, submissionError.message);
    }

    if (submissions && submissions.length > 0) {
      return failure(
        400,
        assignmentErrorCodes.hasSubmissions,
        '제출물이 있는 과제는 삭제할 수 없습니다.'
      );
    }

    const { error: deleteError } = await (supabase
      .from('assignments') as any)
      .delete()
      .eq('id', assignmentId);

    if (deleteError) {
      return failure(
        500,
        assignmentErrorCodes.deleteError,
        deleteError.message
      );
    }

    return success(undefined);
  } catch (err) {
    return failure(
      500,
      assignmentErrorCodes.deleteError,
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    );
  }
};

export const listCourseAssignments = async (
  supabase: SupabaseClient<Database>,
  courseId: string,
  instructorId: string
): Promise<ServiceResult<AssignmentDetail[]>> => {
  try {
    const { data: courseData, error: courseError } = await (supabase
      .from('courses') as any)
      .select('id, title, instructor_id')
      .eq('id', courseId)
      .single();

    if (courseError || !courseData) {
      return failure(
        404,
        assignmentErrorCodes.courseNotFound,
        '코스를 찾을 수 없습니다.'
      );
    }

    const course = courseData as { id: string; title: string; instructor_id: string };

    if (course.instructor_id !== instructorId) {
      return failure(
        403,
        assignmentErrorCodes.unauthorizedAccess,
        '본인의 코스만 조회할 수 있습니다.'
      );
    }

    const { data: assignments, error } = await (supabase
      .from('assignments') as any)
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      return failure(500, assignmentErrorCodes.fetchError, error.message);
    }

    if (!assignments) {
      return success([]);
    }

    const assignmentList: AssignmentDetail[] = assignments.map((assignment) => ({
      id: assignment.id,
      courseId: course.id,
      courseTitle: course.title,
      title: assignment.title,
      description: assignment.description,
      status: assignment.status,
      dueAt: assignment.due_at,
      scoreWeight: Number(assignment.score_weight),
      allowLate: assignment.allow_late,
      allowResubmission: assignment.allow_resubmission,
      publishedAt: assignment.published_at,
      closedAt: assignment.closed_at,
      submission: null,
    }));

    return success(assignmentList);
  } catch (err) {
    return failure(
      500,
      assignmentErrorCodes.fetchError,
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    );
  }
};

export const listCourseAssignmentsForLearner = async (
  supabase: SupabaseClient<Database>,
  courseId: string,
  learnerId: string
): Promise<ServiceResult<AssignmentDetail[]>> => {
  try {
    const { data: courseData, error: courseError } = await (supabase
      .from('courses') as any)
      .select('id, title')
      .eq('id', courseId)
      .single();

    if (courseError || !courseData) {
      return failure(
        404,
        assignmentErrorCodes.courseNotFound,
        '코스를 찾을 수 없습니다.'
      );
    }

    const course = courseData as { id: string; title: string };

    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .eq('learner_id', learnerId)
      .single();

    if (!enrollment) {
      return failure(
        403,
        assignmentErrorCodes.notEnrolled,
        '수강 중인 코스만 조회할 수 있습니다.'
      );
    }

    const { data: assignments, error } = await (supabase
      .from('assignments') as any)
      .select('*')
      .eq('course_id', courseId)
      .in('status', ['published', 'closed'])
      .order('due_at', { ascending: true });

    if (error) {
      return failure(500, assignmentErrorCodes.fetchError, error.message);
    }

    if (!assignments) {
      return success([]);
    }

    const assignmentIds = assignments.map((a: any) => a.id);

    const { data: submissions } = await (supabase
      .from('assignment_submissions') as any)
      .select('*')
      .in('assignment_id', assignmentIds)
      .eq('learner_id', learnerId)
      .eq('is_latest', true);

    const submissionsMap = new Map(
      (submissions || []).map((s: any) => [s.assignment_id, s])
    );

    const assignmentList: AssignmentDetail[] = assignments.map((assignment: any) => {
      const submission = submissionsMap.get(assignment.id) as any;

      const submissionDetail: SubmissionDetail | null = submission
        ? {
            id: submission.id,
            version: submission.version,
            status: submission.status,
            late: submission.late,
            submittedAt: submission.submitted_at,
            contentText: submission.content_text,
            contentLink: submission.content_link,
            score: submission.score ? Number(submission.score) : null,
            feedback: submission.feedback,
            gradedAt: submission.graded_at,
          }
        : null;

      return {
        id: assignment.id,
        courseId: course.id,
        courseTitle: course.title,
        title: assignment.title,
        description: assignment.description,
        status: assignment.status,
        dueAt: assignment.due_at,
        scoreWeight: Number(assignment.score_weight),
        allowLate: assignment.allow_late,
        allowResubmission: assignment.allow_resubmission,
        publishedAt: assignment.published_at,
        closedAt: assignment.closed_at,
        submission: submissionDetail,
      };
    });

    return success(assignmentList);
  } catch (err) {
    return failure(
      500,
      assignmentErrorCodes.fetchError,
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    );
  }
};

export const autoCloseExpiredAssignments = async (
  supabase: SupabaseClient<Database>
): Promise<ServiceResult<{ closedCount: number }>> => {
  try {
    const now = new Date().toISOString();

    const { data: expiredAssignments, error: selectError } = await supabase
      .from('assignments')
      .select('id')
      .eq('status', 'published')
      .lt('due_at', now);

    if (selectError) {
      return failure(
        500,
        assignmentErrorCodes.fetchError,
        selectError.message
      );
    }

    if (!expiredAssignments || expiredAssignments.length === 0) {
      return success({ closedCount: 0 });
    }

    const assignmentIds = expiredAssignments.map((a: any) => a.id);

    const { error: updateError } = await (supabase
      .from('assignments') as any)
      .update({
        status: 'closed',
        closed_at: now,
      })
      .in('id', assignmentIds);

    if (updateError) {
      return failure(
        500,
        assignmentErrorCodes.updateError,
        updateError.message
      );
    }

    return success({ closedCount: assignmentIds.length });
  } catch (err) {
    return failure(
      500,
      assignmentErrorCodes.autoCloseError,
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    );
  }
};

