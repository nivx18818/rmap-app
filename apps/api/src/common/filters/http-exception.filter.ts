import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@repo/db/prisma/client';
import { Response } from 'express';

import { ErrorCode, getErrorMessage } from '../constants/error-codes';

interface ErrorResponse {
  code: number;
  errors?: Record<string, unknown> | unknown[];
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: ErrorResponse = {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: getErrorMessage(ErrorCode.INTERNAL_SERVER_ERROR),
    };

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        if ('code' in exceptionResponse && 'message' in exceptionResponse) {
          errorResponse = exceptionResponse as ErrorResponse;
        } else if ('message' in exceptionResponse) {
          const message = exceptionResponse.message;

          if (Array.isArray(message)) {
            errorResponse = {
              code: ErrorCode.VALIDATION_ERROR,
              errors: this.transformValidationErrors(message),
              message: getErrorMessage(ErrorCode.VALIDATION_ERROR),
            };
          } else if (typeof message === 'string') {
            errorResponse = {
              code: this.getErrorCodeFromStatus(statusCode),
              message,
            };
          }
        }
      } else if (typeof exceptionResponse === 'string') {
        errorResponse = {
          code: this.getErrorCodeFromStatus(statusCode),
          message: exceptionResponse,
        };
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      statusCode = prismaError.statusCode;
      errorResponse = {
        code: prismaError.code,
        message: prismaError.message,
      };
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);

      errorResponse = {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message:
          process.env.NODE_ENV === 'production'
            ? getErrorMessage(ErrorCode.INTERNAL_SERVER_ERROR)
            : exception.message,
      };
    }

    response.status(statusCode).json(errorResponse);
  }

  private getErrorCodeFromStatus(status: HttpStatus): ErrorCode {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.BAD_REQUEST;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.TOO_MANY_REQUESTS;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }

  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
    code: ErrorCode;
    message: string;
    statusCode: HttpStatus;
  } {
    let code: ErrorCode = ErrorCode.DATABASE_ERROR;
    let message: string = '';
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    switch (error.code) {
      case 'P1001':
      case 'P1002':
        code = ErrorCode.DATABASE_ERROR;
        message = 'Database connection failed';
        statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        break;

      case 'P2002': {
        const target = error.meta?.target as string[] | undefined;
        const field = target?.[0] ?? '';

        const codeMap: Record<string, ErrorCode> = {
          email: ErrorCode.EMAIL_ALREADY_EXISTS,
        };

        code = codeMap[field] ?? ErrorCode.CONFLICT;
        statusCode = HttpStatus.CONFLICT;
        break;
      }

      // Foreign key constraint failed
      case 'P2003':
        code = ErrorCode.BAD_REQUEST;
        message = 'Invalid reference to related resource';
        statusCode = HttpStatus.BAD_REQUEST;
        break;

      case 'P2025':
        code = ErrorCode.NOT_FOUND;
        statusCode = HttpStatus.NOT_FOUND;
        break;

      default:
        this.logger.error(`Unhandled Prisma error: ${error.code}`, error.stack);
    }

    return {
      code,
      message: message || getErrorMessage(code),
      statusCode,
    };
  }

  private transformValidationErrors(errors: unknown[]): Record<string, unknown[]> {
    const transformed: Record<string, unknown[]> = {};

    for (const error of errors) {
      if (typeof error === 'object' && error !== null && 'property' in error) {
        const field = (error as { property: string }).property;
        const constraints = (error as { constraints?: Record<string, string> }).constraints;

        if (constraints) {
          transformed[field] = Object.entries(constraints).map(([code, message]) => ({
            code: code.toUpperCase(),
            message,
          }));
        }
      }
    }

    return transformed;
  }
}
