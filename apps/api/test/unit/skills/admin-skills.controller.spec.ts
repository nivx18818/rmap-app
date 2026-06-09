import 'reflect-metadata';

import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';
import { RoleCategory, UserRole } from '@repo/db/prisma/client';

import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { AdminSkillsController } from '@/modules/skills/admin-skills.controller';
import { AdminSkillsService } from '@/modules/skills/admin-skills.service';

describe('AdminSkillsController', () => {
  const skillId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

  const mockAdminSkillsService = {
    createSkill: jest.fn(),
    deleteSkill: jest.fn(),
    getSkill: jest.fn(),
    listSkills: jest.fn(),
    updateSkill: jest.fn(),
  };

  let controller: AdminSkillsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminSkillsController],
      providers: [
        {
          provide: AdminSkillsService,
          useValue: mockAdminSkillsService,
        },
      ],
    }).compile();

    controller = module.get<AdminSkillsController>(AdminSkillsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('requires admin role metadata at the controller level', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AdminSkillsController)).toEqual([UserRole.ADMIN]);
  });

  it('delegates skill listing with query params', async () => {
    const query = {
      page: 2,
      perPage: 10,
      q: 'react',
      roleCategory: RoleCategory.FRAMEWORKS,
    };
    const response = { data: [], meta: { page: 2, perPage: 10, total: 0, totalPages: 0 } };

    mockAdminSkillsService.listSkills.mockResolvedValue(response);

    const result = await controller.list(query);

    expect(mockAdminSkillsService.listSkills).toHaveBeenCalledWith(query);
    expect(result).toEqual(response);
  });

  it('delegates skill creation with body dto', async () => {
    const dto = {
      defaultEstimatedHours: 4,
      description: 'JWT basics',
      name: 'JWT Authentication',
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
    };
    const response = { id: skillId };

    mockAdminSkillsService.createSkill.mockResolvedValue(response);

    const result = await controller.create(dto);

    expect(mockAdminSkillsService.createSkill).toHaveBeenCalledWith(dto);
    expect(result).toEqual(response);
  });

  it('delegates skill detail lookup with path params', async () => {
    const response = { id: skillId, prerequisites: [] };

    mockAdminSkillsService.getSkill.mockResolvedValue(response);

    const result = await controller.get({ skillId });

    expect(mockAdminSkillsService.getSkill).toHaveBeenCalledWith(skillId);
    expect(result).toEqual(response);
  });

  it('delegates skill updates with path params and body dto', async () => {
    const dto = { description: null, name: 'Updated Skill' };
    const response = { id: skillId, name: dto.name };

    mockAdminSkillsService.updateSkill.mockResolvedValue(response);

    const result = await controller.update({ skillId }, dto);

    expect(mockAdminSkillsService.updateSkill).toHaveBeenCalledWith(skillId, dto);
    expect(result).toEqual(response);
  });

  it('delegates skill deletion and returns no body', async () => {
    mockAdminSkillsService.deleteSkill.mockResolvedValue(undefined);

    const result = await controller.remove({ skillId });

    expect(mockAdminSkillsService.deleteSkill).toHaveBeenCalledWith(skillId);
    expect(result).toBeUndefined();
  });
});
