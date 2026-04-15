import 'reflect-metadata';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { ErrorCode, getErrorMessage } from './common/constants/error-codes';
import { getValidationCode } from './common/constants/validation-codes';

const normalizeOrigin = (value: string): string => {
  return value
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\/+$/, '');
};

const resolveCorsOriginMatchers = (): Array<(origin: string) => boolean> => {
  const rawOrigins = (process.env.CLIENT_URLS ?? process.env.CLIENT_URL ?? '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  const fallbackOrigins =
    process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  const allowedOrigins = rawOrigins.length > 0 ? rawOrigins : fallbackOrigins;

  return allowedOrigins.map((allowedOrigin) => {
    if (!allowedOrigin.includes('*')) {
      return (origin: string) => origin === allowedOrigin;
    }

    const escapedPattern = allowedOrigin.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    const pattern = new RegExp(`^${escapedPattern}$`);

    return (origin: string) => pattern.test(origin);
  });
};

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const corsOriginMatchers = resolveCorsOriginMatchers();

  if (corsOriginMatchers.length === 0) {
    logger.warn('No CLIENT_URL/CLIENT_URLS configured. Browser CORS requests will be rejected.');
  }

  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    credentials: true,
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      // Requests without Origin are typically server-to-server or health checks.
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = normalizeOrigin(origin);
      const isAllowed = corsOriginMatchers.some((matches) => matches(normalizedOrigin));

      callback(
        isAllowed ? null : new Error(`Origin "${origin}" is not allowed by CORS`),
        isAllowed,
      );
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
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
                message: message,
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
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
