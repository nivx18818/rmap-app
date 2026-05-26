/* eslint-disable @typescript-eslint/unbound-method */
import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import type { App } from 'supertest/types';

import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { NodeType, RoleCategory } from '@repo/db/prisma/client';
import request from 'supertest';

import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { TemplatesController } from '@/modules/templates/templates.controller';
import { TemplatesService } from '@/modules/templates/templates.service';

describe('TemplatesController', () => {
  let controller: TemplatesController;

  const mockTemplatesService = {
    getTemplate: jest.fn(),
    listTemplateNodes: jest.fn(),
    listTemplates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [
        {
          provide: TemplatesService,
          useValue: mockTemplatesService,
        },
      ],
    }).compile();

    controller = module.get<TemplatesController>(TemplatesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should list public templates', async () => {
    const response = {
      data: [],
      meta: {
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 0,
      },
    };

    mockTemplatesService.listTemplates.mockResolvedValue(response);

    const query = { roleCategory: RoleCategory.WEB_DEVELOPMENT };
    const result = await controller.listTemplates(query);

    expect(mockTemplatesService.listTemplates).toHaveBeenCalledWith(query);
    expect(result).toEqual(response);
  });

  it('should get one public template', async () => {
    const response = {
      deadlineDate: null,
      description: 'A backend template',
      estimatedWeeks: 16,
      generatedAt: '2026-01-01T00:00:00.000Z',
      goalName: null,
      hoursPerDay: null,
      id: 'template-1',
      isTemplate: true,
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
      title: 'Backend Template',
      updatedAt: '2026-01-02T00:00:00.000Z',
      userId: null,
    };

    mockTemplatesService.getTemplate.mockResolvedValue(response);

    const result = await controller.getTemplate('template-1');

    expect(mockTemplatesService.getTemplate).toHaveBeenCalledWith('template-1');
    expect(result).toEqual(response);
  });

  it('should list public template nodes', async () => {
    const response = { nodes: [] };

    mockTemplatesService.listTemplateNodes.mockResolvedValue(response);

    const query = { nodeType: NodeType.REQUIRED };
    const result = await controller.listTemplateNodes('template-1', query);

    expect(mockTemplatesService.listTemplateNodes).toHaveBeenCalledWith('template-1', query);
    expect(result).toEqual(response);
  });

  it('should mark all template endpoints as public', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, TemplatesController.prototype.listTemplates)).toBe(
      true,
    );
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, TemplatesController.prototype.getTemplate)).toBe(
      true,
    );
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, TemplatesController.prototype.listTemplateNodes),
    ).toBe(true);
  });
});

describe('TemplatesController public access', () => {
  let app: INestApplication<App>;

  const response = {
    data: [],
    meta: {
      page: 1,
      perPage: 20,
      total: 0,
      totalPages: 0,
    },
  };

  const template = {
    deadlineDate: null,
    description: 'A public template',
    estimatedWeeks: 16,
    generatedAt: '2026-01-01T00:00:00.000Z',
    goalName: null,
    hoursPerDay: null,
    id: 'template-1',
    isTemplate: true,
    roleCategory: RoleCategory.WEB_DEVELOPMENT,
    title: 'Backend Template',
    updatedAt: '2026-01-02T00:00:00.000Z',
    userId: null,
  };

  const mockTemplatesService = {
    getTemplate: jest.fn().mockResolvedValue(template),
    listTemplateNodes: jest.fn().mockResolvedValue({ nodes: [] }),
    listTemplates: jest.fn().mockResolvedValue(response),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [
        {
          provide: TemplatesService,
          useValue: mockTemplatesService,
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

  it('should allow unauthenticated requests to template routes', async () => {
    await request(app.getHttpServer()).get('/templates').expect(200).expect(response);
    await request(app.getHttpServer()).get('/templates/template-1').expect(200).expect(template);
    await request(app.getHttpServer()).get('/templates/template-1/nodes').expect(200).expect({
      nodes: [],
    });
  });
});
