import type { ArgumentsHost } from '@nestjs/common';
import type { Response } from 'express';

import { BadRequestException, ForbiddenException, HttpException, Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@repo/db/prisma/internal/prismaNamespace';

import { ErrorCode } from '@/common/constants/error-codes';
import { AppForbiddenException } from '@/common/exceptions/app.exceptions';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let response: jest.Mocked<Pick<Response, 'json' | 'status'>>;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    response = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Pick<Response, 'json' | 'status'>>;
    host = {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as ArgumentsHost;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('passes through app exceptions that already use the API error envelope', () => {
    filter.catch(new AppForbiddenException(), host);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      code: ErrorCode.FORBIDDEN,
      message: 'Access denied',
    });
  });

  it('maps default Nest string exceptions to status-based error codes', () => {
    filter.catch(new ForbiddenException('Custom forbidden message'), host);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({
      code: ErrorCode.FORBIDDEN,
      message: 'Custom forbidden message',
    });
  });

  it('normalizes class-validator style BadRequestException arrays', () => {
    filter.catch(
      new BadRequestException([
        {
          constraints: { isEmail: 'email must be an email' },
          property: 'email',
        },
      ]),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      code: ErrorCode.VALIDATION_ERROR,
      errors: {
        email: [{ code: 'ISEMAIL', message: 'email must be an email' }],
      },
      message: 'Validation failed',
    });
  });

  it('maps known Prisma request errors to API error responses', () => {
    filter.catch(
      new PrismaClientKnownRequestError('Unique failed', {
        clientVersion: '1.0',
        code: 'P2002',
        meta: { target: ['email'] },
      }),
      host,
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      code: ErrorCode.EMAIL_ALREADY_EXISTS,
      message: 'Email already registered',
    });
  });

  it('hides unexpected error messages in production', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    process.env.NODE_ENV = 'production';

    try {
      filter.catch(new Error('database password leaked'), host);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
      });
      expect(loggerError).toHaveBeenCalledWith('Unexpected error');
      expect(JSON.stringify(loggerError.mock.calls)).not.toContain('database password leaked');
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('falls back to internal server error for unknown HttpException statuses', () => {
    filter.catch(new HttpException('Teapot', 418), host);

    expect(response.status).toHaveBeenCalledWith(418);
    expect(response.json).toHaveBeenCalledWith({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Teapot',
    });
  });
});
