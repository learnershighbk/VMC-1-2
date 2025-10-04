export const assignmentErrorCodes = {
  fetchError: 'ASSIGNMENT_FETCH_ERROR',
  notFound: 'ASSIGNMENT_NOT_FOUND',
  validationError: 'ASSIGNMENT_VALIDATION_ERROR',
  unauthorizedAccess: 'ASSIGNMENT_UNAUTHORIZED_ACCESS',
  notEnrolled: 'ASSIGNMENT_NOT_ENROLLED',
  notPublished: 'ASSIGNMENT_NOT_PUBLISHED',
  createError: 'ASSIGNMENT_CREATE_ERROR',
  updateError: 'ASSIGNMENT_UPDATE_ERROR',
  deleteError: 'ASSIGNMENT_DELETE_ERROR',
  courseNotFound: 'ASSIGNMENT_COURSE_NOT_FOUND',
  pastDueDate: 'ASSIGNMENT_PAST_DUE_DATE',
  missingRequiredFields: 'ASSIGNMENT_MISSING_REQUIRED_FIELDS',
  hasSubmissions: 'ASSIGNMENT_HAS_SUBMISSIONS',
  cannotDeleteClosed: 'ASSIGNMENT_CANNOT_DELETE_CLOSED',
  cannotEditClosed: 'ASSIGNMENT_CANNOT_EDIT_CLOSED',
  publishedFieldRestriction: 'ASSIGNMENT_PUBLISHED_FIELD_RESTRICTION',
  autoCloseError: 'ASSIGNMENT_AUTO_CLOSE_ERROR',
} as const;

export type AssignmentServiceError = 
  (typeof assignmentErrorCodes)[keyof typeof assignmentErrorCodes];

