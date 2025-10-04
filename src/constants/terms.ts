export const TERMS_VERSION = '1.0.0';

export const TERMS_TYPES = {
  SERVICE: 'service_terms',
  PRIVACY: 'privacy_policy',
} as const;

export type TermsType = typeof TERMS_TYPES[keyof typeof TERMS_TYPES];

export const TERMS_LABELS: Record<TermsType, string> = {
  [TERMS_TYPES.SERVICE]: '이용약관',
  [TERMS_TYPES.PRIVACY]: '개인정보 처리방침',
};

