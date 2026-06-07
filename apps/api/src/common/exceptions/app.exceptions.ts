import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { ErrorCode, getErrorMessage } from '../constants/error-codes';

/**
 * Base App Exception with error code support
 */
export abstract class AppException extends HttpException {
  constructor(
    public readonly errorCode: ErrorCode,
    statusCode: HttpStatus,
    message?: string,
  ) {
    super(
      {
        code: errorCode,
        message: message || getErrorMessage(errorCode),
      },
      statusCode,
    );
  }
}

// =====================================
// 400 - Bad Request (Validation Errors)
// =====================================

export class ValidationException extends AppException {
  constructor(errors?: Record<string, unknown>) {
    super(ErrorCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);
    if (errors) {
      this.getResponse()['errors'] = errors;
    }
  }
}

export class InvalidEmailException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.INVALID_EMAIL,
      message: getErrorMessage(ErrorCode.INVALID_EMAIL),
    });
  }
}

export class InvalidPasswordException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.INVALID_PASSWORD,
      message: getErrorMessage(ErrorCode.INVALID_PASSWORD),
    });
  }
}

export class MissingRequiredFieldException extends BadRequestException {
  constructor(fieldName: string) {
    super({
      code: ErrorCode.MISSING_REQUIRED_FIELD,
      message: `${getErrorMessage(ErrorCode.MISSING_REQUIRED_FIELD)}: ${fieldName}`,
    });
  }
}

export class InvalidFullnameException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.INVALID_FULLNAME,
      message: getErrorMessage(ErrorCode.INVALID_FULLNAME),
    });
  }
}

export class AppBadRequestException extends BadRequestException {
  constructor(message?: string) {
    super({
      code: ErrorCode.BAD_REQUEST,
      message: message || getErrorMessage(ErrorCode.BAD_REQUEST),
    });
  }
}

export class UnsupportedOAuthProviderException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.UNSUPPORTED_OAUTH_PROVIDER,
      message: getErrorMessage(ErrorCode.UNSUPPORTED_OAUTH_PROVIDER),
    });
  }
}

export class DeadlineInPastException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.DEADLINE_IN_PAST,
      message: getErrorMessage(ErrorCode.DEADLINE_IN_PAST),
    });
  }
}

export class InvalidStatusTransitionException extends BadRequestException {
  constructor(from: string, to: string) {
    super({
      code: ErrorCode.INVALID_STATUS_TRANSITION,
      message: `${getErrorMessage(ErrorCode.INVALID_STATUS_TRANSITION)}: ${from} → ${to}`,
    });
  }
}

export class MilestoneSubmissionInvalidUrlException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.MILESTONE_SUBMISSION_INVALID_URL,
      message: getErrorMessage(ErrorCode.MILESTONE_SUBMISSION_INVALID_URL),
    });
  }
}

export class MilestoneSubmissionInvalidCommandException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.MILESTONE_SUBMISSION_INVALID_COMMAND,
      message: getErrorMessage(ErrorCode.MILESTONE_SUBMISSION_INVALID_COMMAND),
    });
  }
}

export class MilestoneSubmissionInProgressException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.MILESTONE_SUBMISSION_IN_PROGRESS,
      message: getErrorMessage(ErrorCode.MILESTONE_SUBMISSION_IN_PROGRESS),
    });
  }
}

export class TemplateNodeInvalidShapeException extends BadRequestException {
  constructor(message?: string) {
    super({
      code: ErrorCode.TEMPLATE_NODE_INVALID_SHAPE,
      message: message || getErrorMessage(ErrorCode.TEMPLATE_NODE_INVALID_SHAPE),
    });
  }
}

export class TemplateNodeInvalidReferenceException extends BadRequestException {
  constructor(message?: string) {
    super({
      code: ErrorCode.TEMPLATE_NODE_INVALID_REFERENCE,
      message: message || getErrorMessage(ErrorCode.TEMPLATE_NODE_INVALID_REFERENCE),
    });
  }
}

export class TemplateNodeInvalidValueException extends BadRequestException {
  constructor(message?: string) {
    super({
      code: ErrorCode.TEMPLATE_NODE_INVALID_VALUE,
      message: message || getErrorMessage(ErrorCode.TEMPLATE_NODE_INVALID_VALUE),
    });
  }
}

export class ActivityDateInvalidException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.ACTIVITY_DATE_INVALID,
      message: getErrorMessage(ErrorCode.ACTIVITY_DATE_INVALID),
    });
  }
}

export class ActivityDateRangeInvalidException extends BadRequestException {
  constructor() {
    super({
      code: ErrorCode.ACTIVITY_DATE_RANGE_INVALID,
      message: getErrorMessage(ErrorCode.ACTIVITY_DATE_RANGE_INVALID),
    });
  }
}

export class QuizSubmissionInvalidException extends BadRequestException {
  constructor(message?: string) {
    super({
      code: ErrorCode.QUIZ_SUBMISSION_INVALID,
      message: message || getErrorMessage(ErrorCode.QUIZ_SUBMISSION_INVALID),
    });
  }
}

export class MilestoneSubmissionInvalidStateException extends BadRequestException {
  constructor(message?: string) {
    super({
      code: ErrorCode.MILESTONE_SUBMISSION_INVALID_STATE,
      message: message || getErrorMessage(ErrorCode.MILESTONE_SUBMISSION_INVALID_STATE),
    });
  }
}

export class RoadmapNodeProgressInvalidUpdateException extends BadRequestException {
  constructor(message?: string) {
    super({
      code: ErrorCode.ROADMAP_NODE_PROGRESS_INVALID_UPDATE,
      message: message || getErrorMessage(ErrorCode.ROADMAP_NODE_PROGRESS_INVALID_UPDATE),
    });
  }
}

// ==========================================
// 401 - Unauthorized (Authentication Errors)
// ==========================================

export class AppUnauthorizedException extends UnauthorizedException {
  constructor(message?: string) {
    super({
      code: ErrorCode.UNAUTHORIZED,
      message: message || getErrorMessage(ErrorCode.UNAUTHORIZED),
    });
  }
}

export class InvalidTokenException extends UnauthorizedException {
  constructor() {
    super({
      code: ErrorCode.INVALID_ACCESS_TOKEN,
      message: getErrorMessage(ErrorCode.INVALID_ACCESS_TOKEN),
    });
  }
}

export class TokenExpiredException extends UnauthorizedException {
  constructor() {
    super({
      code: ErrorCode.ACCESS_TOKEN_EXPIRED,
      message: getErrorMessage(ErrorCode.ACCESS_TOKEN_EXPIRED),
    });
  }
}

export class RefreshTokenInvalidException extends UnauthorizedException {
  constructor() {
    super({
      code: ErrorCode.INVALID_REFRESH_TOKEN,
      message: getErrorMessage(ErrorCode.INVALID_REFRESH_TOKEN),
    });
  }
}

export class MissingAuthenticationException extends UnauthorizedException {
  constructor() {
    super({
      code: ErrorCode.MISSING_AUTHENTICATION,
      message: getErrorMessage(ErrorCode.MISSING_AUTHENTICATION),
    });
  }
}

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({
      code: ErrorCode.INVALID_CREDENTIALS,
      message: getErrorMessage(ErrorCode.INVALID_CREDENTIALS),
    });
  }
}

export class InvalidPasswordResetTokenException extends UnauthorizedException {
  constructor() {
    super({
      code: ErrorCode.INVALID_PASSWORD_RESET_TOKEN,
      message: getErrorMessage(ErrorCode.INVALID_PASSWORD_RESET_TOKEN),
    });
  }
}

// =================================================
// 403 - Forbidden (Authorization/Permission Errors)
// =================================================

export class AppForbiddenException extends ForbiddenException {
  constructor(message?: string) {
    super({
      code: ErrorCode.FORBIDDEN,
      message: message || getErrorMessage(ErrorCode.FORBIDDEN),
    });
  }
}

export class OAuthDisconnectLastSignInMethodException extends ForbiddenException {
  constructor() {
    super({
      code: ErrorCode.OAUTH_DISCONNECT_LAST_SIGN_IN_METHOD,
      message: getErrorMessage(ErrorCode.OAUTH_DISCONNECT_LAST_SIGN_IN_METHOD),
    });
  }
}

// ===============
// 404 - Not Found
// ===============

export class UserNotFoundException extends NotFoundException {
  constructor(identifier: number | string) {
    super({
      code: ErrorCode.USER_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.USER_NOT_FOUND)}: ${identifier}`,
    });
  }
}

export class RoleNotFoundException extends NotFoundException {
  constructor(identifier: number | string) {
    super({
      code: ErrorCode.ROLE_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.ROLE_NOT_FOUND)}: ${identifier}`,
    });
  }
}

export class AppNotFoundException extends NotFoundException {
  constructor(message?: string) {
    super({
      code: ErrorCode.NOT_FOUND,
      message: message || getErrorMessage(ErrorCode.NOT_FOUND),
    });
  }
}

export class RoadmapNotFoundException extends NotFoundException {
  constructor(identifier: number | string) {
    super({
      code: ErrorCode.ROADMAP_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.ROADMAP_NOT_FOUND)}: ${identifier}`,
    });
  }
}

export class RoadmapNodeNotFoundException extends NotFoundException {
  constructor(identifier: number | string) {
    super({
      code: ErrorCode.ROADMAP_NODE_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.ROADMAP_NODE_NOT_FOUND)}: ${identifier}`,
    });
  }
}

export class UserNodeProgressNotFoundException extends NotFoundException {
  constructor(roadmapNodeId: number | string) {
    super({
      code: ErrorCode.USER_NODE_PROGRESS_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.USER_NODE_PROGRESS_NOT_FOUND)}: ${roadmapNodeId}`,
    });
  }
}

export class OAuthIntegrationNotConnectedException extends NotFoundException {
  constructor(provider: string) {
    super({
      code: ErrorCode.OAUTH_INTEGRATION_NOT_CONNECTED,
      message: `${getErrorMessage(ErrorCode.OAUTH_INTEGRATION_NOT_CONNECTED)}: ${provider}`,
    });
  }
}

export class SkillNotFoundException extends NotFoundException {
  constructor(identifier: number | string) {
    super({
      code: ErrorCode.SKILL_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.SKILL_NOT_FOUND)}: ${identifier}`,
    });
  }
}

export class ResourceNotFoundException extends NotFoundException {
  constructor(identifier: number | string) {
    super({
      code: ErrorCode.RESOURCE_NOT_FOUND,
      message: `${getErrorMessage(ErrorCode.RESOURCE_NOT_FOUND)}: ${identifier}`,
    });
  }
}

// ==============
// 409 - Conflict
// ==============

export class EmailAlreadyExistsException extends ConflictException {
  constructor(email: string) {
    super({
      code: ErrorCode.EMAIL_ALREADY_EXISTS,
      message: `${getErrorMessage(ErrorCode.EMAIL_ALREADY_EXISTS)}: ${email}`,
    });
  }
}

export class AppConflictException extends ConflictException {
  constructor(message?: string) {
    super({
      code: ErrorCode.CONFLICT,
      message: message || getErrorMessage(ErrorCode.CONFLICT),
    });
  }
}

export class RefreshTokenAlreadyExistsException extends ConflictException {
  constructor() {
    super({
      code: ErrorCode.REFRESH_TOKEN_ALREADY_EXISTS,
      message: getErrorMessage(ErrorCode.REFRESH_TOKEN_ALREADY_EXISTS),
    });
  }
}

export class OAuthProviderAlreadyConnectedException extends ConflictException {
  constructor(provider: string) {
    super({
      code: ErrorCode.OAUTH_PROVIDER_ALREADY_CONNECTED,
      message: `${getErrorMessage(ErrorCode.OAUTH_PROVIDER_ALREADY_CONNECTED)}: ${provider}`,
    });
  }
}

export class OAuthAccountAlreadyConnectedException extends ConflictException {
  constructor(provider: string) {
    super({
      code: ErrorCode.OAUTH_ACCOUNT_ALREADY_CONNECTED,
      message: `${getErrorMessage(ErrorCode.OAUTH_ACCOUNT_ALREADY_CONNECTED)}: ${provider}`,
    });
  }
}

// ================
// 429 - Rate Limit
// ================

export class RateLimitExceededException extends HttpException {
  constructor(retryAfter?: number) {
    super(
      {
        code: ErrorCode.RATE_LIMIT_EXCEEDED,
        message: getErrorMessage(ErrorCode.RATE_LIMIT_EXCEEDED),
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class TooManyMessagesException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.TOO_MANY_MESSAGES,
        message: getErrorMessage(ErrorCode.TOO_MANY_MESSAGES),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class TooManyRequestsException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.TOO_MANY_REQUESTS,
        message: getErrorMessage(ErrorCode.TOO_MANY_REQUESTS),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

// ================================
// 422 - Unprocessable Entity
// ================================

export class QuizNotPassedException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.QUIZ_NOT_PASSED,
      message: getErrorMessage(ErrorCode.QUIZ_NOT_PASSED),
    });
  }
}

export class QuizNodeTypeInvalidException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.QUIZ_NODE_TYPE_INVALID,
      message: getErrorMessage(ErrorCode.QUIZ_NODE_TYPE_INVALID),
    });
  }
}

export class QuizNodeNotInProgressException extends UnprocessableEntityException {
  constructor() {
    super({
      code: ErrorCode.QUIZ_NODE_NOT_IN_PROGRESS,
      message: getErrorMessage(ErrorCode.QUIZ_NODE_NOT_IN_PROGRESS),
    });
  }
}

export class MilestoneTestsNotPassedException extends UnprocessableEntityException {
  constructor(message?: string) {
    super({
      code: ErrorCode.MILESTONE_TESTS_NOT_PASSED,
      message: message || getErrorMessage(ErrorCode.MILESTONE_TESTS_NOT_PASSED),
    });
  }
}

// ===========================
// 500 - Internal Server Error
// ===========================

export class InternalServerErrorException extends HttpException {
  constructor(message?: string) {
    super(
      {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: message || getErrorMessage(ErrorCode.INTERNAL_SERVER_ERROR),
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class DatabaseErrorException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.DATABASE_ERROR,
        message: getErrorMessage(ErrorCode.DATABASE_ERROR),
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class ExternalServiceErrorException extends HttpException {
  constructor(serviceName?: string) {
    const message = serviceName
      ? `${getErrorMessage(ErrorCode.EXTERNAL_SERVICE_ERROR)}: ${serviceName}`
      : getErrorMessage(ErrorCode.EXTERNAL_SERVICE_ERROR);

    super(
      {
        code: ErrorCode.EXTERNAL_SERVICE_ERROR,
        message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

// ======================
// 503 - Service Unavailable
// ======================

export class RoadmapGenerationUnavailableException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.ROADMAP_GENERATION_UNAVAILABLE,
        message: getErrorMessage(ErrorCode.ROADMAP_GENERATION_UNAVAILABLE),
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class NodeQuizGenerationUnavailableException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.NODE_QUIZ_GENERATION_UNAVAILABLE,
        message: getErrorMessage(ErrorCode.NODE_QUIZ_GENERATION_UNAVAILABLE),
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class MilestoneTestSuiteGenerationUnavailableException extends HttpException {
  constructor() {
    super(
      {
        code: ErrorCode.MILESTONE_TEST_SUITE_GENERATION_UNAVAILABLE,
        message: getErrorMessage(ErrorCode.MILESTONE_TEST_SUITE_GENERATION_UNAVAILABLE),
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export const ErrorCodeToException = {
  // 400 - Bad Request
  [ErrorCode.BAD_REQUEST]: AppBadRequestException,
  [ErrorCode.VALIDATION_ERROR]: ValidationException,
  [ErrorCode.INVALID_EMAIL]: InvalidEmailException,
  [ErrorCode.INVALID_PASSWORD]: InvalidPasswordException,
  [ErrorCode.INVALID_FULLNAME]: InvalidFullnameException,
  [ErrorCode.MISSING_REQUIRED_FIELD]: MissingRequiredFieldException,
  [ErrorCode.DEADLINE_IN_PAST]: DeadlineInPastException,
  [ErrorCode.INVALID_STATUS_TRANSITION]: InvalidStatusTransitionException,
  [ErrorCode.MILESTONE_SUBMISSION_INVALID_URL]: MilestoneSubmissionInvalidUrlException,
  [ErrorCode.MILESTONE_SUBMISSION_INVALID_COMMAND]: MilestoneSubmissionInvalidCommandException,
  [ErrorCode.MILESTONE_SUBMISSION_IN_PROGRESS]: MilestoneSubmissionInProgressException,
  [ErrorCode.TEMPLATE_NODE_INVALID_SHAPE]: TemplateNodeInvalidShapeException,
  [ErrorCode.TEMPLATE_NODE_INVALID_REFERENCE]: TemplateNodeInvalidReferenceException,
  [ErrorCode.TEMPLATE_NODE_INVALID_VALUE]: TemplateNodeInvalidValueException,
  [ErrorCode.ACTIVITY_DATE_INVALID]: ActivityDateInvalidException,
  [ErrorCode.ACTIVITY_DATE_RANGE_INVALID]: ActivityDateRangeInvalidException,
  [ErrorCode.QUIZ_SUBMISSION_INVALID]: QuizSubmissionInvalidException,
  [ErrorCode.MILESTONE_SUBMISSION_INVALID_STATE]: MilestoneSubmissionInvalidStateException,
  [ErrorCode.ROADMAP_NODE_PROGRESS_INVALID_UPDATE]: RoadmapNodeProgressInvalidUpdateException,
  [ErrorCode.UNSUPPORTED_OAUTH_PROVIDER]: UnsupportedOAuthProviderException,
  // 401 - Unauthorized
  [ErrorCode.UNAUTHORIZED]: AppUnauthorizedException,
  [ErrorCode.INVALID_ACCESS_TOKEN]: InvalidTokenException,
  [ErrorCode.ACCESS_TOKEN_EXPIRED]: TokenExpiredException,
  [ErrorCode.INVALID_REFRESH_TOKEN]: RefreshTokenInvalidException,
  [ErrorCode.MISSING_AUTHENTICATION]: MissingAuthenticationException,
  [ErrorCode.INVALID_CREDENTIALS]: InvalidCredentialsException,
  [ErrorCode.INVALID_PASSWORD_RESET_TOKEN]: InvalidPasswordResetTokenException,
  // 403 - Forbidden
  [ErrorCode.FORBIDDEN]: AppForbiddenException,
  [ErrorCode.OAUTH_DISCONNECT_LAST_SIGN_IN_METHOD]: OAuthDisconnectLastSignInMethodException,
  // 404 - Not Found
  [ErrorCode.NOT_FOUND]: AppNotFoundException,
  [ErrorCode.USER_NOT_FOUND]: UserNotFoundException,
  [ErrorCode.ROADMAP_NOT_FOUND]: RoadmapNotFoundException,
  [ErrorCode.ROADMAP_NODE_NOT_FOUND]: RoadmapNodeNotFoundException,
  [ErrorCode.USER_NODE_PROGRESS_NOT_FOUND]: UserNodeProgressNotFoundException,
  [ErrorCode.OAUTH_INTEGRATION_NOT_CONNECTED]: OAuthIntegrationNotConnectedException,
  [ErrorCode.SKILL_NOT_FOUND]: SkillNotFoundException,
  [ErrorCode.ROLE_NOT_FOUND]: RoleNotFoundException,
  [ErrorCode.RESOURCE_NOT_FOUND]: ResourceNotFoundException,
  // 409 - Conflict
  [ErrorCode.CONFLICT]: AppConflictException,
  [ErrorCode.EMAIL_ALREADY_EXISTS]: EmailAlreadyExistsException,
  [ErrorCode.REFRESH_TOKEN_ALREADY_EXISTS]: RefreshTokenAlreadyExistsException,
  [ErrorCode.OAUTH_PROVIDER_ALREADY_CONNECTED]: OAuthProviderAlreadyConnectedException,
  [ErrorCode.OAUTH_ACCOUNT_ALREADY_CONNECTED]: OAuthAccountAlreadyConnectedException,
  // 429 - Too Many Requests
  [ErrorCode.RATE_LIMIT_EXCEEDED]: RateLimitExceededException,
  [ErrorCode.TOO_MANY_MESSAGES]: TooManyMessagesException,
  [ErrorCode.TOO_MANY_REQUESTS]: TooManyRequestsException,
  // 500 - Internal Server Error
  [ErrorCode.INTERNAL_SERVER_ERROR]: InternalServerErrorException,
  [ErrorCode.DATABASE_ERROR]: DatabaseErrorException,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: ExternalServiceErrorException,
  // 503 - Service Unavailable
  [ErrorCode.ROADMAP_GENERATION_UNAVAILABLE]: RoadmapGenerationUnavailableException,
  [ErrorCode.NODE_QUIZ_GENERATION_UNAVAILABLE]: NodeQuizGenerationUnavailableException,
  [ErrorCode.MILESTONE_TEST_SUITE_GENERATION_UNAVAILABLE]:
    MilestoneTestSuiteGenerationUnavailableException,
  // 422 - Unprocessable Entity
  [ErrorCode.QUIZ_NOT_PASSED]: QuizNotPassedException,
  [ErrorCode.QUIZ_NODE_TYPE_INVALID]: QuizNodeTypeInvalidException,
  [ErrorCode.QUIZ_NODE_NOT_IN_PROGRESS]: QuizNodeNotInProgressException,
  [ErrorCode.MILESTONE_TESTS_NOT_PASSED]: MilestoneTestsNotPassedException,
} satisfies Record<ErrorCode, new (...args: any[]) => HttpException>;
