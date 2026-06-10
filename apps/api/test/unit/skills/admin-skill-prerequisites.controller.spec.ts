import 'reflect-metadata';

import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';
import { UserRole } from '@repo/db/prisma/client';

import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { AdminSkillPrerequisitesController } from '@/modules/skills/admin-skill-prerequisites.controller';
import { AdminSkillPrerequisitesService } from '@/modules/skills/admin-skill-prerequisites.service';

describe('AdminSkillPrerequisitesController', () => {
  const skillId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
  const prereqSkillId = '8b5f0d95-8f4a-4ee8-a9f4-0fa0b79f533f';

  const mockAdminSkillPrerequisitesService = {
    createPrerequisite: jest.fn(),
    deletePrerequisite: jest.fn(),
    listPrerequisites: jest.fn(),
  };

  let controller: AdminSkillPrerequisitesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminSkillPrerequisitesController],
      providers: [
        {
          provide: AdminSkillPrerequisitesService,
          useValue: mockAdminSkillPrerequisitesService,
        },
      ],
    }).compile();

    controller = module.get<AdminSkillPrerequisitesController>(AdminSkillPrerequisitesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('requires admin role metadata at the controller level', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AdminSkillPrerequisitesController)).toEqual([
      UserRole.ADMIN,
    ]);
  });

  it('delegates prerequisite listing with path params', async () => {
    const response = { prerequisites: [], skillId };

    mockAdminSkillPrerequisitesService.listPrerequisites.mockResolvedValue(response);

    const result = await controller.list({ skillId });

    expect(mockAdminSkillPrerequisitesService.listPrerequisites).toHaveBeenCalledWith(skillId);
    expect(result).toEqual(response);
  });

  it('delegates prerequisite creation with path params and body dto', async () => {
    const dto = { prerequisiteSkillId: prereqSkillId };

    mockAdminSkillPrerequisitesService.createPrerequisite.mockResolvedValue(undefined);

    const result = await controller.create({ skillId }, dto);

    expect(mockAdminSkillPrerequisitesService.createPrerequisite).toHaveBeenCalledWith(
      skillId,
      dto,
    );
    expect(result).toBeUndefined();
  });

  it('delegates prerequisite deletion and returns no body', async () => {
    mockAdminSkillPrerequisitesService.deletePrerequisite.mockResolvedValue(undefined);

    const result = await controller.remove({ prereqSkillId, skillId });

    expect(mockAdminSkillPrerequisitesService.deletePrerequisite).toHaveBeenCalledWith(
      skillId,
      prereqSkillId,
    );
    expect(result).toBeUndefined();
  });
});
