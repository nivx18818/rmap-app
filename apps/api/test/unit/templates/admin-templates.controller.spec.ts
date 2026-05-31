import 'reflect-metadata';

import type { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import type { App } from 'supertest/types';

import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { NodeType, RoleCategory, UserRole } from '@repo/db/prisma/client';
import request from 'supertest';

import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AdminTemplatesController } from '@/modules/templates/admin-templates.controller';
import { AdminTemplatesService } from '@/modules/templates/admin-templates.service';

describe('AdminTemplatesController', () => {
  const templateId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
  const nodeId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';

  const mockAdminTemplatesService = {
    createNode: jest.fn(),
    createTemplate: jest.fn(),
    deleteNode: jest.fn(),
    deleteTemplate: jest.fn(),
    updateNode: jest.fn(),
    updateTemplate: jest.fn(),
  };

  let controller: AdminTemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTemplatesController],
      providers: [
        {
          provide: AdminTemplatesService,
          useValue: mockAdminTemplatesService,
        },
      ],
    }).compile();

    controller = module.get<AdminTemplatesController>(AdminTemplatesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('requires admin role metadata at the controller level', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AdminTemplatesController)).toEqual([UserRole.ADMIN]);
  });

  it('delegates template creation with body dto', async () => {
    const dto = {
      description: 'A backend template',
      estimatedWeeks: 12,
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
      title: 'Backend Template',
    };
    const response = { id: templateId };

    mockAdminTemplatesService.createTemplate.mockResolvedValue(response);

    const result = await controller.create(dto);

    expect(mockAdminTemplatesService.createTemplate).toHaveBeenCalledWith(dto);
    expect(result).toEqual(response);
  });

  it('delegates template updates with path params and body dto', async () => {
    const dto = { title: 'Updated Backend Template' };
    const response = { id: templateId, title: dto.title };

    mockAdminTemplatesService.updateTemplate.mockResolvedValue(response);

    const result = await controller.update({ templateId }, dto);

    expect(mockAdminTemplatesService.updateTemplate).toHaveBeenCalledWith(templateId, dto);
    expect(result).toEqual(response);
  });

  it('delegates template deletion and returns no body', async () => {
    mockAdminTemplatesService.deleteTemplate.mockResolvedValue(undefined);

    const result = await controller.remove({ templateId });

    expect(mockAdminTemplatesService.deleteTemplate).toHaveBeenCalledWith(templateId);
    expect(result).toBeUndefined();
  });

  it('delegates node creation with path params and body dto', async () => {
    const dto = {
      name: 'HTTP APIs',
      nodeType: NodeType.REQUIRED,
      parentId: nodeId,
      posX: 100,
      posY: 200,
      skillId: '6f9619ff-8b86-d011-b42d-00cf4fc964ff',
    };
    const response = { id: nodeId };

    mockAdminTemplatesService.createNode.mockResolvedValue(response);

    const result = await controller.createNode({ templateId }, dto);

    expect(mockAdminTemplatesService.createNode).toHaveBeenCalledWith(templateId, dto);
    expect(result).toEqual(response);
  });

  it('delegates node updates with path params and body dto', async () => {
    const dto = { posX: 120 };
    const response = { id: nodeId, posX: 120 };

    mockAdminTemplatesService.updateNode.mockResolvedValue(response);

    const result = await controller.updateNode({ nodeId, templateId }, dto);

    expect(mockAdminTemplatesService.updateNode).toHaveBeenCalledWith(templateId, nodeId, dto);
    expect(result).toEqual(response);
  });

  it('delegates node deletion and returns no body', async () => {
    mockAdminTemplatesService.deleteNode.mockResolvedValue(undefined);

    const result = await controller.removeNode({ nodeId, templateId });

    expect(mockAdminTemplatesService.deleteNode).toHaveBeenCalledWith(templateId, nodeId);
    expect(result).toBeUndefined();
  });
});

describe('AdminTemplatesController access', () => {
  let app: INestApplication<App>;
  let currentRole: UserRole;

  const response = {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  };

  const createTemplateDto = {
    description: 'A backend template',
    estimatedWeeks: 12,
    roleCategory: RoleCategory.WEB_DEVELOPMENT,
    title: 'Backend Template',
  };

  const mockAdminTemplatesService = {
    createNode: jest.fn(),
    createTemplate: jest.fn().mockResolvedValue(response),
    deleteNode: jest.fn(),
    deleteTemplate: jest.fn(),
    updateNode: jest.fn(),
    updateTemplate: jest.fn(),
  };

  class AuthContextGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const httpRequest = context.switchToHttp().getRequest<{ user?: { role: UserRole } }>();

      httpRequest.user = { role: currentRole };

      return true;
    }
  }

  beforeEach(async () => {
    currentRole = UserRole.USER;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTemplatesController],
      providers: [
        {
          provide: AdminTemplatesService,
          useValue: mockAdminTemplatesService,
        },
        {
          provide: APP_GUARD,
          useClass: AuthContextGuard,
        },
        {
          provide: APP_GUARD,
          useClass: RolesGuard,
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

  it('forbids authenticated non-admin users through RolesGuard', async () => {
    await request(app.getHttpServer()).post('/admin/templates').send(createTemplateDto).expect(403);

    expect(mockAdminTemplatesService.createTemplate).not.toHaveBeenCalled();
  });

  it('allows admin users to reach admin template mutation endpoints', async () => {
    currentRole = UserRole.ADMIN;

    await request(app.getHttpServer())
      .post('/admin/templates')
      .send(createTemplateDto)
      .expect(201)
      .expect(response);

    expect(mockAdminTemplatesService.createTemplate).toHaveBeenCalledWith(createTemplateDto);
  });
});
