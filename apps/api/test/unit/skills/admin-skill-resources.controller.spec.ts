import 'reflect-metadata';

import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';
import { ResourceType, UserRole } from '@repo/db/prisma/client';

import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { AdminSkillResourcesController } from '@/modules/skills/admin-skill-resources.controller';
import { AdminSkillResourcesService } from '@/modules/skills/admin-skill-resources.service';

describe('AdminSkillResourcesController', () => {
  const skillId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
  const resourceId = 12;

  const mockAdminSkillResourcesService = {
    createResource: jest.fn(),
    deleteResource: jest.fn(),
    listResources: jest.fn(),
    updateResource: jest.fn(),
  };

  let controller: AdminSkillResourcesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminSkillResourcesController],
      providers: [
        {
          provide: AdminSkillResourcesService,
          useValue: mockAdminSkillResourcesService,
        },
      ],
    }).compile();

    controller = module.get<AdminSkillResourcesController>(AdminSkillResourcesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('requires admin role metadata at the controller level', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AdminSkillResourcesController)).toEqual([UserRole.ADMIN]);
  });

  it('delegates resource listing with path params', async () => {
    const response = { resources: [], skillId: skillId };

    mockAdminSkillResourcesService.listResources.mockResolvedValue(response);

    const result = await controller.list({ skillId });

    expect(mockAdminSkillResourcesService.listResources).toHaveBeenCalledWith(skillId);
    expect(result).toEqual(response);
  });

  it('delegates resource creation with path params and body dto', async () => {
    const dto = {
      isPrimary: true,
      resourceType: ResourceType.DOCS,
      title: 'Official docs',
      url: 'https://example.test/docs',
    };
    const response = { id: resourceId };

    mockAdminSkillResourcesService.createResource.mockResolvedValue(response);

    const result = await controller.create({ skillId }, dto);

    expect(mockAdminSkillResourcesService.createResource).toHaveBeenCalledWith(skillId, dto);
    expect(result).toEqual(response);
  });

  it('delegates resource updates with path params and body dto', async () => {
    const dto = { title: 'Updated docs' };
    const response = { id: resourceId, title: dto.title };

    mockAdminSkillResourcesService.updateResource.mockResolvedValue(response);

    const result = await controller.update({ resourceId, skillId }, dto);

    expect(mockAdminSkillResourcesService.updateResource).toHaveBeenCalledWith(
      skillId,
      resourceId,
      dto,
    );
    expect(result).toEqual(response);
  });

  it('delegates resource deletion and returns no body', async () => {
    mockAdminSkillResourcesService.deleteResource.mockResolvedValue(undefined);

    const result = await controller.remove({ resourceId, skillId });

    expect(mockAdminSkillResourcesService.deleteResource).toHaveBeenCalledWith(skillId, resourceId);
    expect(result).toBeUndefined();
  });
});
