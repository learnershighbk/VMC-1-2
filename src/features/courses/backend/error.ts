export const courseErrorCodes = {
  fetchError: 'COURSE_FETCH_ERROR',
  notFound: 'COURSE_NOT_FOUND',
  validationError: 'COURSE_VALIDATION_ERROR',
  unauthorizedAccess: 'COURSE_UNAUTHORIZED_ACCESS',
  createError: 'COURSE_CREATE_ERROR',
  updateError: 'COURSE_UPDATE_ERROR',
  deleteError: 'COURSE_DELETE_ERROR',
} as const;

export type CourseServiceError =
  (typeof courseErrorCodes)[keyof typeof courseErrorCodes];


