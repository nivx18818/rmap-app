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
    getRecommendations: jest.fn(),
    listCategories: jest.fn(),
    listTemplateNodes: jest.fn(),
    listTemplates: jest.fn(),
    listTrendings: jest.fn(),
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

  it('should list public template categories', async () => {
    const response = {
      total: 1,
      categories: [
        {
          category: RoleCategory.WEB_DEVELOPMENT,
          label: 'Web Development',
          templatesCount: 24,
        },
      ],
    };

    mockTemplatesService.listCategories.mockResolvedValue(response);

    const result = await controller.listCategories();

    expect(mockTemplatesService.listCategories).toHaveBeenCalledWith();
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

  it('should get authenticated template recommendations', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'USER',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };
    const response = {
      roleCategories: [],
      total: 0,
      relevantRoadmaps: [],
    };

    mockTemplatesService.getRecommendations.mockResolvedValue(response);

    const result = await controller.getRecommendations(user);

    expect(mockTemplatesService.getRecommendations).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(response);
  });

  it('should list public trending templates', async () => {
    const response = {
      total: 0,
      trendings: [],
    };

    mockTemplatesService.listTrendings.mockResolvedValue(response);

    const result = await controller.listTrendings();

    expect(mockTemplatesService.listTrendings).toHaveBeenCalledWith();
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
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, TemplatesController.prototype.listCategories)).toBe(
      true,
    );
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, TemplatesController.prototype.listTrendings)).toBe(
      true,
    );
    expect(
      Reflect.getMetadata(IS_PUBLIC_KEY, TemplatesController.prototype.getRecommendations),
    ).toBeUndefined();
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
    getRecommendations: jest.fn().mockResolvedValue({
      roleCategories: [],
      total: 0,
      relevantRoadmaps: [],
    }),
    listCategories: jest.fn().mockResolvedValue({
      total: 0,
      categories: [],
    }),
    listTemplateNodes: jest.fn().mockResolvedValue({ nodes: [] }),
    listTemplates: jest.fn().mockResolvedValue(response),
    listTrendings: jest.fn().mockResolvedValue({
      total: 0,
      trendings: [],
    }),
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
    await request(app.getHttpServer()).get('/templates/categories').expect(200).expect({
      total: 0,
      categories: [],
    });
    await request(app.getHttpServer()).get('/templates/trendings').expect(200).expect({
      total: 0,
      trendings: [],
    });
    await request(app.getHttpServer()).get('/templates/template-1').expect(200).expect(template);
    await request(app.getHttpServer()).get('/templates/template-1/nodes').expect(200).expect({
      nodes: [],
    });
  });
});
