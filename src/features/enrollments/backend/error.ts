export const enrollmentErrorCodes = {
  fetchError: 'ENROLLMENT_FETCH_ERROR',
  createError: 'ENROLLMENT_CREATE_ERROR',
  duplicateEnrollment: 'ENROLLMENT_DUPLICATE',
  courseNotPublished: 'COURSE_NOT_PUBLISHED',
  notLearner: 'ENROLLMENT_NOT_LEARNER',
  unauthorizedAccess: 'ENROLLMENT_UNAUTHORIZED_ACCESS',
} as const;

export type EnrollmentServiceError =
  (typeof enrollmentErrorCodes)[keyof typeof enrollmentErrorCodes];


