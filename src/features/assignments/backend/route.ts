import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import {
  AssignmentParamsSchema,
  CreateAssignmentSchema,
  UpdateAssignmentSchema,
} from './schema';
import {
  getAssignmentDetail,
  createAssignment,
  updateAssignment,
  publishAssignment,
  closeAssignment,
  deleteAssignment,
  listCourseAssignments,
  listCourseAssignmentsForLearner,
  autoCloseExpiredAssignments,
} from './service';
import { respond, failure } from '@/backend/http/response';
import { assignmentErrorCodes } from './error';

export const registerAssignmentsRoutes = (app: Hono<AppEnv>) => {
  const assignmentsRouter = new Hono<AppEnv>();

  assignmentsRouter.get('/:id', async (c) => {
    const supabase = c.get('supabase');
    const id = c.req.param('id');

    const parsedParams = AssignmentParamsSchema.safeParse({ id });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(400, assignmentErrorCodes.validationError, '잘못된 과제 ID입니다.')
      );
    }

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const result = await getAssignmentDetail(
      supabase,
      parsedParams.data.id,
      userData.user.id
    );

    return respond(c, result);
  });

  assignmentsRouter.post('/', async (c) => {
    const supabase = c.get('supabase');

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const body = await c.req.json();
    const parsedBody = CreateAssignmentSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          assignmentErrorCodes.validationError,
          parsedBody.error.errors[0]?.message ?? '잘못된 요청입니다.'
        )
      );
    }

    const result = await createAssignment(
      supabase,
      userData.user.id,
      parsedBody.data
    );

    return respond(c, result);
  });

  assignmentsRouter.patch('/:id', async (c) => {
    const supabase = c.get('supabase');
    const id = c.req.param('id');

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const parsedParams = AssignmentParamsSchema.safeParse({ id });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(400, assignmentErrorCodes.validationError, '잘못된 과제 ID입니다.')
      );
    }

    const body = await c.req.json();
    const parsedBody = UpdateAssignmentSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          assignmentErrorCodes.validationError,
          parsedBody.error.errors[0]?.message ?? '잘못된 요청입니다.'
        )
      );
    }

    const result = await updateAssignment(
      supabase,
      parsedParams.data.id,
      userData.user.id,
      parsedBody.data
    );

    return respond(c, result);
  });

  assignmentsRouter.post('/:id/publish', async (c) => {
    const supabase = c.get('supabase');
    const id = c.req.param('id');

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const parsedParams = AssignmentParamsSchema.safeParse({ id });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(400, assignmentErrorCodes.validationError, '잘못된 과제 ID입니다.')
      );
    }

    const result = await publishAssignment(
      supabase,
      parsedParams.data.id,
      userData.user.id
    );

    return respond(c, result);
  });

  assignmentsRouter.post('/:id/close', async (c) => {
    const supabase = c.get('supabase');
    const id = c.req.param('id');

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const parsedParams = AssignmentParamsSchema.safeParse({ id });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(400, assignmentErrorCodes.validationError, '잘못된 과제 ID입니다.')
      );
    }

    const result = await closeAssignment(
      supabase,
      parsedParams.data.id,
      userData.user.id
    );

    return respond(c, result);
  });

  assignmentsRouter.delete('/:id', async (c) => {
    const supabase = c.get('supabase');
    const id = c.req.param('id');

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const parsedParams = AssignmentParamsSchema.safeParse({ id });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(400, assignmentErrorCodes.validationError, '잘못된 과제 ID입니다.')
      );
    }

    const result = await deleteAssignment(
      supabase,
      parsedParams.data.id,
      userData.user.id
    );

    return respond(c, result);
  });

  assignmentsRouter.get('/course/:courseId', async (c) => {
    const supabase = c.get('supabase');
    const courseId = c.req.param('courseId');

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const result = await listCourseAssignments(
      supabase,
      courseId,
      userData.user.id
    );

    return respond(c, result);
  });

  assignmentsRouter.get('/course/:courseId/learner', async (c) => {
    const supabase = c.get('supabase');
    const courseId = c.req.param('courseId');

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const result = await listCourseAssignmentsForLearner(
      supabase,
      courseId,
      userData.user.id
    );

    return respond(c, result);
  });

  assignmentsRouter.post('/auto-close', async (c) => {
    const supabase = c.get('supabase');

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const result = await autoCloseExpiredAssignments(supabase);

    return respond(c, result);
  });

  app.route('/assignments', assignmentsRouter);
};

