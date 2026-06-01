import { BadRequestException, type INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { ErrorCode, getErrorMessage } from './common/constants/error-codes';
import { getValidationCode } from './common/constants/validation-codes';

type CorsOrigin = RegExp | string | undefined;

export function configureApp(app: INestApplication): void {
  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    credentials: true,
    origin: createCorsOrigin(process.env.CLIENT_URL),
  });

  app.useGlobalPipes(createValidationPipe());
}

export function createCorsOrigin(clientUrl: string | undefined): CorsOrigin {
  const normalizedClientUrl = clientUrl?.trim();

  if (!normalizedClientUrl) {
    return undefined;
  }

  if (!normalizedClientUrl.includes('*')) {
    return normalizedClientUrl;
  }

  return wildcardOriginToRegExp(normalizedClientUrl);
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

function wildcardOriginToRegExp(origin: string): RegExp {
  const pattern = origin.split('*').map(escapeRegExp).join('[^/]*');

  return new RegExp(`^${pattern}$`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
