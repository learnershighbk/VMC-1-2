import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import { SignupRequestSchema } from './schema';
import { createUserWithProfile } from './service';
import {
  authErrorCodes,
  type AuthServiceError,
} from './error';

export const registerAuthRoutes = (app: Hono<AppEnv>) => {
  app.post('/auth/signup', async (c) => {
    const body = await c.req.json();
    const parsedBody = SignupRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          authErrorCodes.validationError,
          '입력값이 유효하지 않습니다.',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await createUserWithProfile(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<AuthServiceError, unknown>;
      logger.error('Signup failed', {
        code: errorResult.error.code,
        message: errorResult.error.message,
      });
      return respond(c, result);
    }

    logger.info('User signup successful', { userId: result.data.userId });
    return respond(c, result);
  });
};

