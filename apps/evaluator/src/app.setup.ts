import { BadRequestException, type INestApplication, ValidationPipe } from '@nestjs/common';

export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: () => new BadRequestException('Malformed evaluator payload'),
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
}
