export const authErrorCodes = {
  emailAlreadyExists: 'AUTH_EMAIL_ALREADY_EXISTS',
  weakPassword: 'AUTH_WEAK_PASSWORD',
  invalidEmail: 'AUTH_INVALID_EMAIL',
  invalidPhone: 'AUTH_INVALID_PHONE',
  termsNotConsented: 'AUTH_TERMS_NOT_CONSENTED',
  authServiceError: 'AUTH_SERVICE_ERROR',
  profileCreationError: 'AUTH_PROFILE_CREATION_ERROR',
  termsLogError: 'AUTH_TERMS_LOG_ERROR',
  validationError: 'AUTH_VALIDATION_ERROR',
} as const;

type AuthErrorValue = (typeof authErrorCodes)[keyof typeof authErrorCodes];

export type AuthServiceError = AuthErrorValue;

