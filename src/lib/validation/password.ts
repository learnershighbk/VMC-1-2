export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' };
  }
  
  if (!PASSWORD_REGEX.test(password)) {
    return { 
      valid: false, 
      message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.' 
    };
  }
  
  return { valid: true };
};

