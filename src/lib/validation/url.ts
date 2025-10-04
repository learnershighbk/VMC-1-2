export const URL_REGEX = /^(https?:\/\/)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\/.*)?$/;

export const validateUrl = (url: string): { valid: boolean; message?: string } => {
  if (!url) {
    return { valid: true };
  }
  
  if (!URL_REGEX.test(url)) {
    return { 
      valid: false, 
      message: '올바른 URL 형식을 입력해주세요. (http:// 또는 https://로 시작)' 
    };
  }
  
  return { valid: true };
};

