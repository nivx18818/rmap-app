import type { Server } from 'node:http';

import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { createHmac } from 'node:crypto';
import request from 'supertest';

import { configureApp } from '@/app.setup';
import { EvaluatorAuthService } from '@/evaluator/evaluator-auth.service';
import { EvaluatorController } from '@/evaluator/evaluator.controller';
import { EvaluatorService } from '@/evaluator/evaluator.service';
import { HealthController } from '@/evaluator/health.controller';

const SHARED_SECRET = 'test-evaluator-secret';

const makePayload = (overrides: Record<string, unknown> = {}) => ({
  repoUrl: 'https://github.com/acme/api-project',
  submissionId: 'submission-1',
  testFileContent: 'console.log("RMAP_MILESTONE_RESULTS:{}");',
  timeoutMs: 120_000,
  ...overrides,
});

const sign = (rawBody: string, timestamp: string) =>
  createHmac('sha256', SHARED_SECRET).update(`${timestamp}.${rawBody}`).digest('hex');

describe('EvaluatorController', () => {
  let app: INestApplication;
  let executeEvaluator: jest.MockedFunction<EvaluatorService['execute']>;

  beforeEach(async () => {
    executeEvaluator = jest.fn().mockResolvedValue({
      outputLog: 'ok',
      passRatePct: 100,
      passedTests: 6,
      status: 'PASSED',
      testResults: [],
      totalTests: 6,
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluatorController, HealthController],
      providers: [
        EvaluatorAuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'EVALUATOR_SHARED_SECRET' ? SHARED_SECRET : undefined,
            ),
          },
        },
        {
          provide: EvaluatorService,
          useValue: {
            execute: executeEvaluator,
          },
        },
      ],
    }).compile();

    app = module.createNestApplication({ rawBody: true });
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should expose health without evaluator signatures', async () => {
    await request(app.getHttpServer() as Server)
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('should accept valid signed requests', async () => {
    const payload = makePayload();
    const rawBody = JSON.stringify(payload);
    const timestamp = Date.now().toString();

    await request(app.getHttpServer() as Server)
      .post('/internal/evaluator/execute')
      .set('content-type', 'application/json')
      .set('x-rmap-timestamp', timestamp)
      .set('x-rmap-signature', sign(rawBody, timestamp))
      .send(rawBody)
      .expect(201);

    expect(executeEvaluator).toHaveBeenCalledWith(payload);
  });

  it('should reject invalid signatures', async () => {
    const rawBody = JSON.stringify(makePayload());

    await request(app.getHttpServer() as Server)
      .post('/internal/evaluator/execute')
      .set('content-type', 'application/json')
      .set('x-rmap-timestamp', Date.now().toString())
      .set('x-rmap-signature', 'bad-signature')
      .send(rawBody)
      .expect(401);
  });

  it('should reject stale timestamps', async () => {
    const rawBody = JSON.stringify(makePayload());
    const timestamp = (Date.now() - 10 * 60 * 1000).toString();

    await request(app.getHttpServer() as Server)
      .post('/internal/evaluator/execute')
      .set('content-type', 'application/json')
      .set('x-rmap-timestamp', timestamp)
      .set('x-rmap-signature', sign(rawBody, timestamp))
      .send(rawBody)
      .expect(401);
  });

  it('should reject invalid repo URLs', async () => {
    const rawBody = JSON.stringify(makePayload({ repoUrl: 'https://example.com/acme/project' }));
    const timestamp = Date.now().toString();

    await request(app.getHttpServer() as Server)
      .post('/internal/evaluator/execute')
      .set('content-type', 'application/json')
      .set('x-rmap-timestamp', timestamp)
      .set('x-rmap-signature', sign(rawBody, timestamp))
      .send(rawBody)
      .expect(400);
  });

  it('should reject oversized test content', async () => {
    const rawBody = JSON.stringify(makePayload({ testFileContent: 'x'.repeat(100_001) }));
    const timestamp = Date.now().toString();

    await request(app.getHttpServer() as Server)
      .post('/internal/evaluator/execute')
      .set('content-type', 'application/json')
      .set('x-rmap-timestamp', timestamp)
      .set('x-rmap-signature', sign(rawBody, timestamp))
      .send(rawBody)
      .expect(400);
  });
});
