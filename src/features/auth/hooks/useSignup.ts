import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { SignupRequest, SignupResponse } from '../lib/dto';

const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await apiClient.post<SignupResponse>('/auth/signup', data);
  return response.data;
};

export const useSignup = () => {
  return useMutation({
    mutationFn: signup,
  });
};

