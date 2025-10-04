import { createMiddleware } from 'hono/factory';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import {
  contextKeys,
  type AppEnv,
} from '@/backend/hono/context';

export const withSupabase = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const config = c.get(
      contextKeys.config,
    ) as AppEnv['Variables']['config'] | undefined;

    if (!config) {
      throw new Error('Application configuration is not available.');
    }

    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : undefined;

    const client = createClient<Database>(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: accessToken 
            ? { Authorization: `Bearer ${accessToken}` } 
            : {},
        },
      }
    );

    c.set(contextKeys.supabase, client);

    await next();
  });
