/* eslint-disable @typescript-eslint/unbound-method */
import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import type { App } from 'supertest/types';

import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { SyncController } from '@/modules/sync/sync.controller';
import { SyncService } from '@/modules/sync/sync.service';

describe('SyncController', () => {
  let controller: SyncController;

  const mockSyncService = {
    getVersions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: SyncService,
          useValue: mockSyncService,
        },
      ],
    }).compile();

    controller = module.get<SyncController>(SyncController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return sync versions', async () => {
    const response = {
      roadmaps: '2026-06-11T10:00:00.000Z',
      skills: '2026-06-01T08:00:00.000Z',
      resources: '2026-05-20T12:00:00.000Z',
    };

    mockSyncService.getVersions.mockResolvedValue(response);

    await expect(controller.getVersions()).resolves.toEqual(response);
    expect(mockSyncService.getVersions).toHaveBeenCalledWith();
  });

  it('should mark the version endpoint as public', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, SyncController.prototype.getVersions)).toBe(true);
  });
});

describe('SyncController public access', () => {
  let app: INestApplication<App>;

  const response = {
    roadmaps: '2026-06-11T10:00:00.000Z',
    skills: '2026-06-01T08:00:00.000Z',
    resources: '2026-05-20T12:00:00.000Z',
  };

  const mockSyncService = {
    getVersions: jest.fn().mockResolvedValue(response),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: SyncService,
          useValue: mockSyncService,
        },
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('should allow unauthenticated requests to sync version route', async () => {
    await request(app.getHttpServer()).get('/sync/version').expect(200).expect(response);
  });
});
