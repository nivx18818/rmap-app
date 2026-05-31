/**
 * 5-digit error codes
 * Pattern: [HTTP_STATUS][SEQUENCE]
 */

export enum ErrorCode {
  // 400 - Bad Request
  BAD_REQUEST = 40000,
  VALIDATION_ERROR = 40001,
  INVALID_EMAIL = 40002,
  INVALID_PASSWORD = 40003,
  INVALID_FULLNAME = 40004,
  MISSING_REQUIRED_FIELD = 40005,
  DEADLINE_IN_PAST = 40006,
  INVALID_STATUS_TRANSITION = 40007,
  MILESTONE_SUBMISSION_INVALID_URL = 40008,
  MILESTONE_SUBMISSION_INVALID_COMMAND = 40009,
  MILESTONE_SUBMISSION_IN_PROGRESS = 40010,
  TEMPLATE_NODE_INVALID_SHAPE = 40011,
  TEMPLATE_NODE_INVALID_REFERENCE = 40012,
  TEMPLATE_NODE_INVALID_VALUE = 40013,
  ACTIVITY_DATE_INVALID = 40014,
  ACTIVITY_DATE_RANGE_INVALID = 40015,
  QUIZ_SUBMISSION_INVALID = 40016,
  MILESTONE_SUBMISSION_INVALID_STATE = 40017,
  ROADMAP_NODE_PROGRESS_INVALID_UPDATE = 40018,
  // 401 - Unauthorized
  UNAUTHORIZED = 40100,
  INVALID_ACCESS_TOKEN = 40101,
  ACCESS_TOKEN_EXPIRED = 40102,
  INVALID_REFRESH_TOKEN = 40103,
  MISSING_AUTHENTICATION = 40104,
  INVALID_CREDENTIALS = 40105,
  // 403 - Forbidden
  FORBIDDEN = 40300,
  // 404 - Not Found
  NOT_FOUND = 40400,
  USER_NOT_FOUND = 40401,
  ROADMAP_NOT_FOUND = 40402,
  SKILL_NOT_FOUND = 40403,
  ROLE_NOT_FOUND = 40404,
  RESOURCE_NOT_FOUND = 40405,
  ROADMAP_NODE_NOT_FOUND = 40406,
  USER_NODE_PROGRESS_NOT_FOUND = 40407,
  // 409 - Conflict
  CONFLICT = 40900,
  EMAIL_ALREADY_EXISTS = 40901,
  REFRESH_TOKEN_ALREADY_EXISTS = 40902,
  // 429 - Too Many Requests
  RATE_LIMIT_EXCEEDED = 42900,
  TOO_MANY_MESSAGES = 42901,
  TOO_MANY_REQUESTS = 42902,
  // 422 - Unprocessable Entity
  QUIZ_NOT_PASSED = 42200,
  QUIZ_NODE_TYPE_INVALID = 42201,
  QUIZ_NODE_NOT_IN_PROGRESS = 42202,
  MILESTONE_TESTS_NOT_PASSED = 42203,
  // 500 - Internal Server Error
  INTERNAL_SERVER_ERROR = 50000,
  DATABASE_ERROR = 50001,
  EXTERNAL_SERVICE_ERROR = 50002,
  // 503 - Service Unavailable
  ROADMAP_GENERATION_UNAVAILABLE = 50300,
  NODE_QUIZ_GENERATION_UNAVAILABLE = 50301,
}

export const ErrorMessages: Record<ErrorCode, string> = {
  // 400 - Bad Request
  [ErrorCode.BAD_REQUEST]: 'Bad request',
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.INVALID_EMAIL]: 'Invalid email format',
  [ErrorCode.INVALID_PASSWORD]: 'Invalid password format',
  [ErrorCode.INVALID_FULLNAME]: 'Invalid username format',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCode.DEADLINE_IN_PAST]: 'deadline_date must be in the future',
  [ErrorCode.INVALID_STATUS_TRANSITION]: 'Invalid status transition',
  [ErrorCode.MILESTONE_SUBMISSION_INVALID_URL]:
    'Milestone submission repoUrl must match https://github.com/<owner>/<repo>',
  [ErrorCode.MILESTONE_SUBMISSION_INVALID_COMMAND]:
    'Milestone submission testCommand must be npm test or npm run <script>',
  [ErrorCode.MILESTONE_SUBMISSION_IN_PROGRESS]:
    'A milestone submission is already running for this node',
  [ErrorCode.TEMPLATE_NODE_INVALID_SHAPE]: 'Template node shape is invalid',
  [ErrorCode.TEMPLATE_NODE_INVALID_REFERENCE]: 'Template node reference is invalid',
  [ErrorCode.TEMPLATE_NODE_INVALID_VALUE]: 'Template node value is invalid',
  [ErrorCode.ACTIVITY_DATE_INVALID]: 'Invalid activity date',
  [ErrorCode.ACTIVITY_DATE_RANGE_INVALID]: 'Invalid activity date range',
  [ErrorCode.QUIZ_SUBMISSION_INVALID]: 'Quiz submission is invalid',
  [ErrorCode.MILESTONE_SUBMISSION_INVALID_STATE]: 'Milestone submission state is invalid',
  [ErrorCode.ROADMAP_NODE_PROGRESS_INVALID_UPDATE]: 'Roadmap node progress update is invalid',
  // 401 - Unauthorized
  [ErrorCode.UNAUTHORIZED]: 'Authentication required',
  [ErrorCode.INVALID_ACCESS_TOKEN]: 'Invalid authentication token',
  [ErrorCode.ACCESS_TOKEN_EXPIRED]: 'Authentication token has expired',
  [ErrorCode.INVALID_REFRESH_TOKEN]: 'Invalid or expired refresh token',
  [ErrorCode.MISSING_AUTHENTICATION]: 'Missing authentication credentials',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid credentials',
  // 403 - Forbidden
  [ErrorCode.FORBIDDEN]: 'Access denied',
  // 404 - Not Found
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.USER_NOT_FOUND]: 'User not found',
  [ErrorCode.ROADMAP_NOT_FOUND]: 'Roadmap not found',
  [ErrorCode.SKILL_NOT_FOUND]: 'Skill not found',
  [ErrorCode.ROLE_NOT_FOUND]: 'Role not found',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Learning resource not found',
  [ErrorCode.ROADMAP_NODE_NOT_FOUND]: 'Roadmap node not found',
  [ErrorCode.USER_NODE_PROGRESS_NOT_FOUND]: 'User node progress not found',
  // 409 - Conflict
  [ErrorCode.CONFLICT]: 'The resource is in a conflicting state',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'Email already registered',
  [ErrorCode.REFRESH_TOKEN_ALREADY_EXISTS]: 'Refresh token already exists',
  // 429 - Too Many Requests
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ErrorCode.TOO_MANY_MESSAGES]: 'Too many messages sent',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests',
  // 422 - Unprocessable Entity
  [ErrorCode.QUIZ_NOT_PASSED]: 'Quiz must be passed before completing this node',
  [ErrorCode.QUIZ_NODE_TYPE_INVALID]: 'Quiz is only available for required or optional leaf nodes',
  [ErrorCode.QUIZ_NODE_NOT_IN_PROGRESS]: 'Quiz is only available for in-progress roadmap nodes',
  [ErrorCode.MILESTONE_TESTS_NOT_PASSED]: 'Milestone tests must pass before completing this node',
  // 500 - Internal Server Error
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred',
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service is unavailable',
  // 503 - Service Unavailable
  [ErrorCode.ROADMAP_GENERATION_UNAVAILABLE]:
    'Roadmap generation is temporarily unavailable. Please try again later and explore default templates while waiting.',
  [ErrorCode.NODE_QUIZ_GENERATION_UNAVAILABLE]:
    'Quiz generation is temporarily unavailable. Please try again in a few moments.',
};

export function getErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] || ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR];
}
