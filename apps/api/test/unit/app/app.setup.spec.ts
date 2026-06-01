/* eslint-disable @typescript-eslint/unbound-method */
import type { ArgumentMetadata, INestApplication, ValidationError } from '@nestjs/common';
import type { BadRequestException } from '@nestjs/common';

import { configureApp, createValidationPipe } from '@/app.setup';
import { ErrorCode } from '@/common/constants/error-codes';
import { RegisterDto } from '@/modules/auth/dto/register.dto';

describe('app.setup', () => {
  it('configures middleware, prefix, CORS, and the global validation pipe', () => {
    const app = {
      enableCors: jest.fn(),
      setGlobalPrefix: jest.fn(),
      use: jest.fn(),
      useGlobalPipes: jest.fn(),
    } as unknown as INestApplication;

    process.env.CLIENT_URL = 'http://localhost:3000';
    configureApp(app);

    expect(app.use).toHaveBeenCalledWith(expect.any(Function));
    expect(app.setGlobalPrefix).toHaveBeenCalledWith('api/v1');
    expect(app.enableCors).toHaveBeenCalledWith({
      credentials: true,
      origin: 'http://localhost:3000',
    });
    expect(app.useGlobalPipes).toHaveBeenCalledWith(expect.any(Object));
  });

  it('returns validation errors using configured validation codes', async () => {
    const pipe = createValidationPipe();
    const metadata: ArgumentMetadata = {
      data: '',
      metatype: RegisterDto,
      type: 'body',
    };

    await expect(
      pipe.transform(
        {
          email: 'not-an-email',
          fullName: '',
          password: 'short',
          unexpectedField: true,
        },
        metadata,
      ),
    ).rejects.toMatchObject({
      response: {
        code: ErrorCode.VALIDATION_ERROR,
        errors: {
          email: [expect.objectContaining({ code: 'EMAIL_FORMAT_INVALID' })],
          fullName: [expect.objectContaining({ code: 'VALUE_REQUIRED' })],
          password: [expect.objectContaining({ code: 'STRING_TYPE_MIN_LENGTH' })],
          unexpectedField: [expect.objectContaining({ code: 'PROPERTY_NOT_ALLOWED' })],
        },
        message: 'Validation failed',
      },
    });
  });

  it('keeps a validation field entry even when class-validator provides no constraints', () => {
    const pipe = createValidationPipe();
    const factory = (
      pipe as unknown as {
        exceptionFactory: (errors: ValidationError[]) => BadRequestException;
      }
    ).exceptionFactory;

    const exception = factory([{ property: 'metadata' }]);

    expect(exception.getResponse()).toEqual({
      code: ErrorCode.VALIDATION_ERROR,
      errors: { metadata: [] },
      message: 'Validation failed',
    });
  });
});
