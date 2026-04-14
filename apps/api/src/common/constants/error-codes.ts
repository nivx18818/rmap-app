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
  // 409 - Conflict
  CONFLICT = 40900,
  EMAIL_ALREADY_EXISTS = 40901,
  REFRESH_TOKEN_ALREADY_EXISTS = 40902,
  // 429 - Too Many Requests
  RATE_LIMIT_EXCEEDED = 42900,
  TOO_MANY_MESSAGES = 42901,
  TOO_MANY_REQUESTS = 42902,
  // 500 - Internal Server Error
  INTERNAL_SERVER_ERROR = 50000,
  DATABASE_ERROR = 50001,
  EXTERNAL_SERVICE_ERROR = 50002,
}

export const ErrorMessages: Record<ErrorCode, string> = {
  // 400 - Bad Request
  [ErrorCode.BAD_REQUEST]: 'Bad request',
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.INVALID_EMAIL]: 'Invalid email format',
  [ErrorCode.INVALID_PASSWORD]: 'Invalid password format',
  [ErrorCode.INVALID_FULLNAME]: 'Invalid username format',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
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
  // 409 - Conflict
  [ErrorCode.CONFLICT]: 'The resource is in a conflicting state',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'Email already registered',
  [ErrorCode.REFRESH_TOKEN_ALREADY_EXISTS]: 'Refresh token already exists',
  // 429 - Too Many Requests
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded',
  [ErrorCode.TOO_MANY_MESSAGES]: 'Too many messages sent',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests',
  // 500 - Internal Server Error
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred',
  [ErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service is unavailable',
};

export function getErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] || ErrorMessages[ErrorCode.INTERNAL_SERVER_ERROR];
}
