import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { submissionErrorCodes } from './error';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { 
  SubmitAssignmentInput, 
  AssignmentSubmissionItem,
  AssignmentSubmissionListResponse,
  ReviewSubmissionInput,
  MyGradesResponse,
  AssignmentGradeItem,
  CourseGradeSummary,
} from './schema';

type ServiceResult<T> = HandlerResult<T, string, unknown>;

export interface SubmissionDetail {
  id: string;
  assignmentId: string;
  version: number;
  status: string;
  late: boolean;
  submittedAt: string;
  contentText: string;
  contentLink: string | null;
}

export const submitAssignment = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  input: SubmitAssignmentInput
): Promise<ServiceResult<SubmissionDetail>> => {
  try {
    const { data: assignment, error: assignmentError } = await (supabase
      .from('assignments') as any)
      .select('*, course:courses(id, instructor_id)')
      .eq('id', input.assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return failure(
        404,
        submissionErrorCodes.assignmentNotFound,
        '과제를 찾을 수 없습니다.'
      );
    }

    const assignmentData = assignment as any;
    const course = assignmentData.course;

    const { data: enrollment } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('course_id', course.id)
      .eq('learner_id', userId)
      .single();

    if (!enrollment) {
      return failure(
        403,
        submissionErrorCodes.notEnrolled,
        '수강 중인 코스만 제출 가능합니다.'
      );
    }

    if (assignmentData.status !== 'published') {
      if (assignmentData.status === 'closed') {
        return failure(
          400,
          submissionErrorCodes.assignmentClosed,
          '마감된 과제입니다.'
        );
      }
      return failure(
        400,
        submissionErrorCodes.assignmentNotPublished,
        '아직 공개되지 않은 과제입니다.'
      );
    }

    const now = new Date();
    const dueAt = new Date(assignmentData.due_at);
    const isLate = now > dueAt;

    if (isLate && !assignmentData.allow_late) {
      return failure(
        400,
        submissionErrorCodes.deadlinePassed,
        '마감일이 지나 제출할 수 없습니다.'
      );
    }

    const { data: existingSubmission } = await (supabase
      .from('assignment_submissions') as any)
      .select('*')
      .eq('assignment_id', input.assignmentId)
      .eq('learner_id', userId)
      .eq('is_latest', true)
      .single();

    if (existingSubmission && !assignmentData.allow_resubmission) {
      return failure(
        400,
        submissionErrorCodes.resubmissionNotAllowed,
        '이미 제출한 과제입니다. 재제출이 허용되지 않습니다.'
      );
    }

    const nextVersion = existingSubmission ? existingSubmission.version + 1 : 1;

    if (existingSubmission) {
      const { error: updateError } = await (supabase
        .from('assignment_submissions') as any)
        .update({ is_latest: false })
        .eq('id', existingSubmission.id);

      if (updateError) {
        return failure(
          500,
          submissionErrorCodes.createError,
          '제출 처리 중 오류가 발생했습니다.'
        );
      }
    }

    const { data: newSubmission, error: insertError } = await (supabase
      .from('assignment_submissions') as any)
      .insert({
        assignment_id: input.assignmentId,
        learner_id: userId,
        version: nextVersion,
        is_latest: true,
        status: 'submitted',
        late: isLate,
        content_text: input.textContent,
        content_link: input.linkContent || null,
        submitted_at: now.toISOString(),
      })
      .select()
      .single();

    if (insertError || !newSubmission) {
      return failure(
        500,
        submissionErrorCodes.createError,
        insertError?.message ?? '제출에 실패했습니다.'
      );
    }

    const submissionDetail: SubmissionDetail = {
      id: newSubmission.id,
      assignmentId: newSubmission.assignment_id,
      version: newSubmission.version,
      status: newSubmission.status,
      late: newSubmission.late,
      submittedAt: newSubmission.submitted_at,
      contentText: newSubmission.content_text,
      contentLink: newSubmission.content_link,
    };

    return success(submissionDetail);
  } catch (err) {
    return failure(
      500,
      submissionErrorCodes.createError,
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    );
  }
};

export const getSubmissionByAssignment = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  assignmentId: string
): Promise<ServiceResult<SubmissionDetail | null>> => {
  try {
    const { data: submission, error } = await (supabase
      .from('assignment_submissions') as any)
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('learner_id', userId)
      .eq('is_latest', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return success(null);
      }
      return failure(
        500,
        submissionErrorCodes.fetchError,
        error.message
      );
    }

    if (!submission) {
      return success(null);
    }

    const submissionDetail: SubmissionDetail = {
      id: submission.id,
      assignmentId: submission.assignment_id,
      version: submission.version,
      status: submission.status,
      late: submission.late,
      submittedAt: submission.submitted_at,
      contentText: submission.content_text,
      contentLink: submission.content_link,
    };

    return success(submissionDetail);
  } catch (err) {
    return failure(
      500,
      submissionErrorCodes.fetchError,
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    );
  }
};

export const listAssignmentSubmissionsForInstructor = async (
  supabase: SupabaseClient<Database>,
  instructorId: string,
  assignmentId: string
): Promise<ServiceResult<AssignmentSubmissionListResponse>> => {
  try {
    const { data: assignment, error: assignmentError } = await (supabase
      .from('assignments') as any)
      .select('*, course:courses(id, instructor_id)')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return failure(
        404,
        submissionErrorCodes.assignmentNotFound,
        '과제를 찾을 수 없습니다.'
      );
    }

    const assignmentData = assignment as any;
    const course = assignmentData.course;

    if (course.instructor_id !== instructorId) {
      return failure(
        403,
        submissionErrorCodes.unauthorized,
        '본인 과제만 조회 가능합니다.'
      );
    }

    const { data: submissions, error: submissionsError } = await (supabase
      .from('assignment_submissions') as any)
      .select(`
        *,
        learner:profiles!assignment_submissions_learner_id_fkey(id, full_name)
      `)
      .eq('assignment_id', assignmentId)
      .eq('is_latest', true)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      return failure(
        500,
        submissionErrorCodes.fetchError,
        submissionsError.message
      );
    }

    const submissionItems: AssignmentSubmissionItem[] = (submissions || []).map((sub: any) => ({
      id: sub.id,
      assignmentId: sub.assignment_id,
      learnerId: sub.learner_id,
      learnerName: sub.learner?.full_name || '알 수 없음',
      version: sub.version,
      status: sub.status,
      late: sub.late,
      submittedAt: sub.submitted_at,
      contentText: sub.content_text,
      contentLink: sub.content_link,
      score: sub.score,
      feedback: sub.feedback,
      gradedAt: sub.graded_at,
    }));

    const response: AssignmentSubmissionListResponse = {
      assignment: {
        id: assignmentData.id,
        title: assignmentData.title,
        status: assignmentData.status,
        dueAt: assignmentData.due_at,
      },
      submissions: submissionItems,
    };

    return success(response);
  } catch (err) {
    return failure(
      500,
      submissionErrorCodes.fetchError,
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    );
  }
};

export const reviewSubmission = async (
  supabase: SupabaseClient<Database>,
  instructorId: string,
  submissionId: string,
  input: ReviewSubmissionInput
): Promise<ServiceResult<AssignmentSubmissionItem>> => {
  try {
    const { data: submission, error: submissionError } = await (supabase
      .from('assignment_submissions') as any)
      .select(`
        *,
        assignment:assignments(
          id,
          course:courses(id, instructor_id)
        ),
        learner:profiles!assignment_submissions_learner_id_fkey(id, full_name)
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return failure(
        404,
        submissionErrorCodes.submissionNotFound,
        '제출물을 찾을 수 없습니다.'
      );
    }

    const submissionData = submission as any;
    const assignmentData = submissionData.assignment;
    const course = assignmentData.course;

    if (course.instructor_id !== instructorId) {
      return failure(
        403,
        submissionErrorCodes.unauthorized,
        '본인 과제의 제출물만 채점할 수 있습니다.'
      );
    }

    if (!submissionData.is_latest) {
      return failure(
        409,
        submissionErrorCodes.stateConflict,
        '최신 제출물만 채점할 수 있습니다.'
      );
    }

    const now = new Date().toISOString();
    let updateData: any;

    if (input.action === 'grade') {
      if (input.score === undefined || input.score === null) {
        return failure(
          400,
          submissionErrorCodes.scoreOutOfRange,
          '점수를 입력해주세요.'
        );
      }

      if (input.score < 0 || input.score > 100) {
        return failure(
          400,
          submissionErrorCodes.scoreOutOfRange,
          '점수는 0 이상 100 이하여야 합니다.'
        );
      }

      updateData = {
        feedback: input.feedback,
        status: 'graded',
        score: input.score,
        graded_at: now,
        graded_by: instructorId,
      };
    } else if (input.action === 'requestResubmission') {
      if (submissionData.status === 'resubmission_required') {
        return failure(
          409,
          submissionErrorCodes.stateConflict,
          '이미 재제출 요청된 제출물입니다.'
        );
      }

      updateData = {
        feedback: input.feedback,
        status: 'resubmission_required',
        score: null,
        graded_at: null,
        graded_by: null,
      };
    }

    const { data: updatedSubmission, error: updateError } = await (supabase
      .from('assignment_submissions') as any)
      .update(updateData)
      .eq('id', submissionId)
      .select(`
        *,
        learner:profiles!assignment_submissions_learner_id_fkey(id, full_name)
      `)
      .single();

    if (updateError || !updatedSubmission) {
      return failure(
        500,
        submissionErrorCodes.createError,
        updateError?.message ?? '채점 처리 중 오류가 발생했습니다.'
      );
    }

    const result: AssignmentSubmissionItem = {
      id: updatedSubmission.id,
      assignmentId: updatedSubmission.assignment_id,
      learnerId: updatedSubmission.learner_id,
      learnerName: updatedSubmission.learner?.full_name || '알 수 없음',
      version: updatedSubmission.version,
      status: updatedSubmission.status,
      late: updatedSubmission.late,
      submittedAt: updatedSubmission.submitted_at,
      contentText: updatedSubmission.content_text,
      contentLink: updatedSubmission.content_link,
      score: updatedSubmission.score,
      feedback: updatedSubmission.feedback,
      gradedAt: updatedSubmission.graded_at,
    };

    return success(result);
  } catch (err) {
    return failure(
      500,
      submissionErrorCodes.createError,
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    );
  }
};

export const getMyGrades = async (
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ServiceResult<MyGradesResponse>> => {
  try {
    const { data: enrollments, error: enrollError } = await (supabase
      .from('course_enrollments') as any)
      .select(`
        course_id,
        courses (
          id,
          title,
          instructor_id,
          instructor:profiles!courses_instructor_id_fkey(full_name)
        )
      `)
      .eq('learner_id', userId);

    if (enrollError) {
      return failure(500, submissionErrorCodes.fetchError, enrollError.message);
    }

    if (!enrollments || enrollments.length === 0) {
      return success({ courses: [] });
    }

    const courseSummaries: CourseGradeSummary[] = [];

    for (const enrollment of enrollments) {
      const courseData = enrollment.courses as any;
      
      if (!courseData) continue;

      const { data: assignments, error: assignError } = await (supabase
        .from('assignments') as any)
        .select('*')
        .eq('course_id', courseData.id)
        .neq('status', 'draft')
        .order('due_at', { ascending: true });

      if (assignError) {
        return failure(500, submissionErrorCodes.fetchError, assignError.message);
      }

      const assignmentGrades: AssignmentGradeItem[] = [];
      let totalScore = 0;
      let gradedCount = 0;

      for (const assignment of assignments || []) {
        const { data: submission, error: submissionError } = await (supabase
          .from('assignment_submissions') as any)
          .select('*')
          .eq('assignment_id', assignment.id)
          .eq('learner_id', userId)
          .eq('is_latest', true)
          .maybeSingle();

        if (submissionError && submissionError.code !== 'PGRST116') {
          return failure(500, submissionErrorCodes.fetchError, submissionError.message);
        }

        const gradeItem: AssignmentGradeItem = {
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          assignmentStatus: assignment.status,
          dueAt: assignment.due_at,
          scoreWeight: assignment.score_weight,
          submissionId: submission?.id || null,
          submittedAt: submission?.submitted_at || null,
          status: submission?.status || null,
          late: submission?.late || null,
          score: submission?.score || null,
          feedback: submission?.feedback || null,
          gradedAt: submission?.graded_at || null,
        };

        assignmentGrades.push(gradeItem);

        if (submission?.status === 'graded' && submission?.score !== null) {
          totalScore += (submission.score * assignment.score_weight) / 100;
          gradedCount++;
        }
      }

      const instructorData = courseData.instructor as any;
      const instructorName = instructorData?.full_name || '알 수 없음';

      courseSummaries.push({
        courseId: courseData.id,
        courseTitle: courseData.title,
        instructorName,
        totalAssignments: assignments?.length || 0,
        gradedAssignments: gradedCount,
        totalScore: gradedCount > 0 ? totalScore : null,
        maxPossibleScore: 100,
        assignments: assignmentGrades,
      });
    }

    return success({ courses: courseSummaries });
  } catch (err) {
    return failure(
      500,
      submissionErrorCodes.fetchError,
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
    );
  }
};

