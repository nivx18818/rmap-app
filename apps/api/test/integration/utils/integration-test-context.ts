import type { INestApplication } from '@nestjs/common';
import type { Response } from 'supertest';
import type { App } from 'supertest/types';

import request from 'supertest';

import type { PrismaService } from '@/modules/prisma/prisma.service';

import { INTEGRATION_PASSWORD, resetDatabase } from './database';
import { createIntegrationApp } from './integration-app';

export type IntegrationTestContext = {
  readonly app: INestApplication<App>;
  loginAs: (email: string) => Promise<Response>;
  readonly prisma: PrismaService;
};

export function setupIntegrationTest(): IntegrationTestContext {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const integration = await createIntegrationApp();

    app = integration.app;
    prisma = integration.prisma;
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    if (prisma) await resetDatabase(prisma);
    if (app) await app.close();
  });

  return {
    get app() {
      return app;
    },
    loginAs: async (email: string) =>
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: INTEGRATION_PASSWORD })
        .expect(200),
    get prisma() {
      return prisma;
    },
  };
}
