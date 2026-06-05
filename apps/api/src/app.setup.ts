import {
  BadRequestException,
  type INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { ErrorCode, getErrorMessage } from './common/constants/error-codes';
import { getValidationCode } from './common/constants/validation-codes';

export function configureApp(app: INestApplication): void {
  app.use(cookieParser());

  app.setGlobalPrefix('api/v1', {
    exclude: [{ method: RequestMethod.GET, path: 'health' }],
  });

  app.enableCors({
    credentials: true,
    origin: process.env.CLIENT_URL,
  });

  app.useGlobalPipes(createValidationPipe());
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) => {
      const formattedErrors: Record<string, Array<{ code: string; message: string }>> = {};

      errors.forEach((error) => {
        const fieldErrors: Array<{ code: string; message: string }> = [];

        if (error.constraints) {
          Object.entries(error.constraints).forEach(([constraintKey, message]) => {
            fieldErrors.push({
              code: getValidationCode(constraintKey),
              message,
            });
          });
        }

        formattedErrors[error.property] = fieldErrors;
      });

      return new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        errors: formattedErrors,
        message: getErrorMessage(ErrorCode.VALIDATION_ERROR),
      });
    },
  });
}
