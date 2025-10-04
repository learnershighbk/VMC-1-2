import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import { TERMS_VERSION } from '@/constants/terms';
import {
  authErrorCodes,
  type AuthServiceError,
} from '@/features/auth/backend/error';
import type { SignupRequest, SignupResponse } from './schema';

export const createUserWithProfile = async (
  client: SupabaseClient,
  data: SignupRequest,
): Promise<HandlerResult<SignupResponse, AuthServiceError, unknown>> => {
  const { data: authData, error: authError } = await client.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: undefined,
    },
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      return failure(409, authErrorCodes.emailAlreadyExists, '이미 가입된 이메일입니다.');
    }
    return failure(500, authErrorCodes.authServiceError, authError.message);
  }

  if (!authData.user) {
    return failure(500, authErrorCodes.authServiceError, '사용자 생성에 실패했습니다.');
  }

  const userId = authData.user.id;

  await client.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });

  const { error: profileError } = await client
    .from('profiles')
    .insert({
      id: userId,
      role: data.role,
      full_name: data.fullName,
      phone_number: data.phoneNumber,
    });

  if (profileError) {
    await client.auth.admin.deleteUser(userId);
    return failure(500, authErrorCodes.profileCreationError, '프로필 생성에 실패했습니다.');
  }

  const termsToInsert = [
    {
      user_id: userId,
      version: TERMS_VERSION,
      accepted_at: new Date().toISOString(),
    },
  ];

  const { error: termsError } = await client
    .from('terms_acceptances')
    .insert(termsToInsert);

  if (termsError) {
    await client.from('profiles').delete().eq('id', userId);
    await client.auth.admin.deleteUser(userId);
    return failure(500, authErrorCodes.termsLogError, '약관 동의 이력 저장에 실패했습니다.');
  }

  const redirectUrl = data.role === 'learner' ? '/courses' : '/dashboard';

  return success({
    userId,
    email: data.email,
    role: data.role,
    redirectUrl,
  }, 201);
};

