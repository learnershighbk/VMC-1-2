import { z } from 'zod';
import { PASSWORD_MIN_LENGTH, PASSWORD_REGEX } from '@/lib/validation/password';
import { PHONE_REGEX } from '@/lib/validation/phone';

export const SignupRequestSchema = z.object({
  email: z.string().email({ message: '올바른 이메일 형식이 아닙니다.' }),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, { message: `비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.` })
    .regex(PASSWORD_REGEX, { message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.' }),
  role: z.enum(['learner', 'instructor'], { 
    errorMap: () => ({ message: '역할은 learner 또는 instructor만 선택 가능합니다.' }) 
  }),
  fullName: z
    .string()
    .min(2, { message: '이름은 최소 2자 이상이어야 합니다.' })
    .max(50, { message: '이름은 최대 50자까지 입력 가능합니다.' }),
  phoneNumber: z
    .string()
    .regex(PHONE_REGEX, { message: '휴대폰 번호는 010-XXXX-XXXX 형식이어야 합니다.' }),
  termsConsent: z.object({
    service: z.boolean().refine((val) => val === true, { 
      message: '이용약관에 동의해야 합니다.' 
    }),
    privacy: z.boolean().refine((val) => val === true, { 
      message: '개인정보 처리방침에 동의해야 합니다.' 
    }),
  }),
});

export const SignupResponseSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['learner', 'instructor']),
  redirectUrl: z.string(),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type SignupResponse = z.infer<typeof SignupResponseSchema>;

