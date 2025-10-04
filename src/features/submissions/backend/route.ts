import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { respond, failure } from '@/backend/http/response';
import { SubmitAssignmentSchema, ReviewSubmissionSchema } from './schema';
import { submitAssignment, listAssignmentSubmissionsForInstructor, reviewSubmission, getMyGrades } from './service';
import { submissionErrorCodes } from './error';

export const registerSubmissionsRoutes = (app: Hono<AppEnv>) => {
  app.post('/submissions', async (c) => {
    const supabase = c.get('supabase');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return c.json(
        { success: false, error: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
        401
      );
    }

    const body = await c.req.json();
    const parsedBody = SubmitAssignmentSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          submissionErrorCodes.validationError,
          parsedBody.error.errors[0]?.message ?? '잘못된 요청입니다.'
        )
      );
    }

    const result = await submitAssignment(supabase, user.id, parsedBody.data);

    return respond(c, result);
  });

  app.get('/submissions/assignment/:assignmentId', async (c) => {
    const supabase = c.get('supabase');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return c.json(
        { success: false, error: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
        401
      );
    }

    const assignmentId = c.req.param('assignmentId');

    if (!assignmentId) {
      return respond(
        c,
        failure(
          400,
          submissionErrorCodes.validationError,
          '과제 ID가 필요합니다.'
        )
      );
    }

    const result = await listAssignmentSubmissionsForInstructor(
      supabase,
      user.id,
      assignmentId
    );

    return respond(c, result);
  });

  app.patch('/submissions/:submissionId', async (c) => {
    const supabase = c.get('supabase');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return c.json(
        { success: false, error: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
        401
      );
    }

    const submissionId = c.req.param('submissionId');

    if (!submissionId) {
      return respond(
        c,
        failure(
          400,
          submissionErrorCodes.validationError,
          '제출물 ID가 필요합니다.'
        )
      );
    }

    const body = await c.req.json();
    const parsedBody = ReviewSubmissionSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          submissionErrorCodes.validationError,
          parsedBody.error.errors[0]?.message ?? '잘못된 요청입니다.'
        )
      );
    }

    const result = await reviewSubmission(
      supabase,
      user.id,
      submissionId,
      parsedBody.data
    );

    return respond(c, result);
  });

  app.get('/submissions/my-grades', async (c) => {
    const supabase = c.get('supabase');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return c.json(
        { success: false, error: 'UNAUTHORIZED', message: '인증이 필요합니다.' },
        401
      );
    }

    const result = await getMyGrades(supabase, user.id);

    return respond(c, result);
  });
};

