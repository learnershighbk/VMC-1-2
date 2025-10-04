import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import {
  EnrollmentRequestSchema,
} from './schema';
import { createEnrollment, getMyEnrollments } from './service';
import { respond, failure } from '@/backend/http/response';
import { enrollmentErrorCodes } from './error';

export const registerEnrollmentsRoutes = (app: Hono<AppEnv>) => {
  const enrollmentsRouter = new Hono<AppEnv>();

  enrollmentsRouter.post('/', async (c) => {
    const supabase = c.get('supabase');

    const body = await c.req.json();
    const parsedBody = EnrollmentRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(400, enrollmentErrorCodes.createError, '잘못된 요청입니다.')
      );
    }

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const result = await createEnrollment(
      supabase,
      userData.user.id,
      parsedBody.data.courseId
    );

    return respond(c, result);
  });

  enrollmentsRouter.get('/', async (c) => {
    const supabase = c.get('supabase');

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const result = await getMyEnrollments(supabase, userData.user.id);

    return respond(c, result);
  });

  app.route('/enrollments', enrollmentsRouter);
};


