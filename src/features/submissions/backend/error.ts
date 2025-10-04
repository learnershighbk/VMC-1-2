export const submissionErrorCodes = {
  validationError: 'SUBMISSION_VALIDATION_ERROR',
  notEnrolled: 'SUBMISSION_NOT_ENROLLED',
  assignmentNotFound: 'SUBMISSION_ASSIGNMENT_NOT_FOUND',
  assignmentNotPublished: 'SUBMISSION_ASSIGNMENT_NOT_PUBLISHED',
  assignmentClosed: 'SUBMISSION_ASSIGNMENT_CLOSED',
  deadlinePassed: 'SUBMISSION_DEADLINE_PASSED',
  resubmissionNotAllowed: 'SUBMISSION_RESUBMISSION_NOT_ALLOWED',
  createError: 'SUBMISSION_CREATE_ERROR',
  fetchError: 'SUBMISSION_FETCH_ERROR',
  unauthorized: 'SUBMISSION_UNAUTHORIZED',
  stateConflict: 'SUBMISSION_STATE_CONFLICT',
  scoreOutOfRange: 'SUBMISSION_SCORE_OUT_OF_RANGE',
  feedbackRequired: 'SUBMISSION_FEEDBACK_REQUIRED',
  submissionNotFound: 'SUBMISSION_NOT_FOUND',
} as const;

