export const PHONE_REGEX = /^010-\d{4}-\d{4}$/;

export const validatePhone = (phone: string): { valid: boolean; message?: string } => {
  if (!PHONE_REGEX.test(phone)) {
    return { 
      valid: false, 
      message: '휴대폰 번호는 010-XXXX-XXXX 형식이어야 합니다.' 
    };
  }
  
  return { valid: true };
};

export const formatPhoneInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
};

