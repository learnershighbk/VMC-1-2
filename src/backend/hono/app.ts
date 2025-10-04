import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerAuthRoutes } from '@/features/auth/backend/route';
import { registerCoursesRoutes } from '@/features/courses/backend/route';
import { registerEnrollmentsRoutes } from '@/features/enrollments/backend/route';
import { registerAssignmentsRoutes } from '@/features/assignments/backend/route';
import { registerSubmissionsRoutes } from '@/features/submissions/backend/route';
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp) {
    return singletonApp;
  }

  const app = new Hono<AppEnv>().basePath('/api');

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  registerExampleRoutes(app);
  registerAuthRoutes(app);
  registerCoursesRoutes(app);
  registerEnrollmentsRoutes(app);
  registerAssignmentsRoutes(app);
  registerSubmissionsRoutes(app);

  singletonApp = app;

  return app;
};
