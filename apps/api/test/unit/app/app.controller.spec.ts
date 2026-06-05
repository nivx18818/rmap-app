/* eslint-disable @typescript-eslint/unbound-method */
import type { Server } from 'node:http';

import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppController } from '@/app.controller';
import { configureApp } from '@/app.setup';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

describe('AppController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    process.env.CLIENT_URL = 'http://localhost:3000';
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should expose health without the API prefix', async () => {
    await request(app.getHttpServer() as Server)
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('should mark health as public', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, AppController.prototype.getHealth)).toBe(true);
  });
});
