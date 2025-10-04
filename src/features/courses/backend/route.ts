import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import {
  CourseListQuerySchema,
  CourseParamsSchema,
  CreateCourseSchema,
  UpdateCourseSchema,
} from './schema';
import {
  listCourses,
  getCourseDetail,
  createCourse,
  updateCourse,
  publishCourse,
  deleteCourse,
  listMyCourses,
} from './service';
import { respond, failure } from '@/backend/http/response';
import { courseErrorCodes } from './error';

export const registerCoursesRoutes = (app: Hono<AppEnv>) => {
  const coursesRouter = new Hono<AppEnv>();

  coursesRouter.get('/', async (c) => {
    const supabase = c.get('supabase');

    const queryParams = {
      search: c.req.query('search'),
      category: c.req.query('category'),
      difficulty: c.req.query('difficulty'),
      sort: c.req.query('sort') as 'latest' | 'popular' | undefined,
      status: c.req.query('status') as
        | 'draft'
        | 'published'
        | 'archived'
        | undefined,
    };

    const parsedQuery = CourseListQuerySchema.safeParse(queryParams);

    if (!parsedQuery.success) {
      return respond(
        c,
        failure(400, courseErrorCodes.validationError, '잘못된 요청입니다.')
      );
    }

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const result = await listCourses(supabase, parsedQuery.data, userId);

    return respond(c, result);
  });

  coursesRouter.get('/my', async (c) => {
    const supabase = c.get('supabase');

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const result = await listMyCourses(supabase, userData.user.id);

    return respond(c, result);
  });

  coursesRouter.get('/:id', async (c) => {
    const supabase = c.get('supabase');
    const id = c.req.param('id');

    const parsedParams = CourseParamsSchema.safeParse({ id });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(400, courseErrorCodes.validationError, '잘못된 코스 ID입니다.')
      );
    }

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const result = await getCourseDetail(
      supabase,
      parsedParams.data.id,
      userData.user.id
    );

    return respond(c, result);
  });

  coursesRouter.post('/', async (c) => {
    const supabase = c.get('supabase');

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const body = await c.req.json();
    const parsedBody = CreateCourseSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          courseErrorCodes.validationError,
          parsedBody.error.errors[0]?.message ?? '잘못된 요청입니다.'
        )
      );
    }

    const result = await createCourse(
      supabase,
      userData.user.id,
      parsedBody.data
    );

    return respond(c, result);
  });

  coursesRouter.patch('/:id', async (c) => {
    const supabase = c.get('supabase');
    const id = c.req.param('id');

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const parsedParams = CourseParamsSchema.safeParse({ id });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(400, courseErrorCodes.validationError, '잘못된 코스 ID입니다.')
      );
    }

    const body = await c.req.json();
    const parsedBody = UpdateCourseSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          courseErrorCodes.validationError,
          parsedBody.error.errors[0]?.message ?? '잘못된 요청입니다.'
        )
      );
    }

    const result = await updateCourse(
      supabase,
      parsedParams.data.id,
      userData.user.id,
      parsedBody.data
    );

    return respond(c, result);
  });

  coursesRouter.post('/:id/publish', async (c) => {
    const supabase = c.get('supabase');
    const id = c.req.param('id');

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const parsedParams = CourseParamsSchema.safeParse({ id });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(400, courseErrorCodes.validationError, '잘못된 코스 ID입니다.')
      );
    }

    const result = await publishCourse(
      supabase,
      parsedParams.data.id,
      userData.user.id
    );

    return respond(c, result);
  });

  coursesRouter.delete('/:id', async (c) => {
    const supabase = c.get('supabase');
    const id = c.req.param('id');

    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return c.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        401
      );
    }

    const parsedParams = CourseParamsSchema.safeParse({ id });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(400, courseErrorCodes.validationError, '잘못된 코스 ID입니다.')
      );
    }

    const result = await deleteCourse(
      supabase,
      parsedParams.data.id,
      userData.user.id
    );

    return respond(c, result);
  });

  app.route('/courses', coursesRouter);
};


