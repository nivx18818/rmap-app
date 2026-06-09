import type { TestingModule } from '@nestjs/testing';

import { HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RoleCategory } from '@repo/db/prisma/client';
import { PrismaClientKnownRequestError } from '@repo/db/prisma/internal/prismaNamespace';

import { ErrorCode } from '@/common/constants/error-codes';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AdminSkillsService } from '@/modules/skills/admin-skills.service';

type AsyncMock<TResult = unknown, TArgs extends unknown[] = unknown[]> = jest.Mock<
  Promise<TResult>,
  TArgs
>;

type DecimalLike = {
  toNumber?: () => number;
  toString: () => string;
};

interface SkillRecord {
  createdAt: Date;
  defaultEstimatedHours: DecimalLike | null | number;
  description: null | string;
  id: string;
  name: string;
  roleCategory: null | RoleCategory;
  updatedAt: Date;
}

interface SkillDetailRecord extends SkillRecord {
  prerequisites: Array<{
    prerequisiteSkill: {
      name: string;
    };
    prerequisiteSkillId: string;
  }>;
}

interface AdminSkillsPrismaMock {
  $transaction: AsyncMock<unknown, [unknown]>;
  roadmapNode: {
    findFirst: AsyncMock<{ id: string } | null>;
  };
  skill: {
    count: AsyncMock<number>;
    create: AsyncMock<SkillRecord>;
    delete: AsyncMock<{ id: string }>;
    findMany: AsyncMock<SkillRecord[]>;
    findUnique: AsyncMock<SkillDetailRecord | SkillRecord | { id: string } | null>;
    update: AsyncMock<SkillRecord>;
  };
}

const skillId = 'skill-1';

const expectExceptionCode = async (promise: Promise<unknown>, code: ErrorCode): Promise<void> => {
  let caught: unknown;

  try {
    await promise;
  } catch (error) {
    caught = error;
  }

  if (!(caught instanceof HttpException)) {
    throw new Error('Expected promise to reject with an HttpException');
  }

  expect(caught.getResponse()).toMatchObject({ code });
};

const makeDecimal = (value: number): DecimalLike => ({
  toNumber: () => value,
  toString: () => String(value),
});

const makeSkill = (overrides: Partial<SkillRecord> = {}): SkillRecord => ({
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  defaultEstimatedHours: makeDecimal(6.5),
  description: 'Skill description',
  id: skillId,
  name: 'React Fundamentals',
  roleCategory: RoleCategory.FRAMEWORKS,
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  ...overrides,
});

const makeUniqueNameError = (): PrismaClientKnownRequestError =>
  new PrismaClientKnownRequestError('Unique failed', {
    clientVersion: 'test',
    code: 'P2002',
    meta: { target: ['name'] },
  });

const createPrismaMock = (): AdminSkillsPrismaMock => ({
  $transaction: jest.fn<Promise<unknown>, [unknown]>().mockImplementation((input) => {
    if (Array.isArray(input)) {
      return Promise.all(input);
    }

    return Promise.resolve(input);
  }),
  roadmapNode: {
    findFirst: jest.fn<Promise<{ id: string } | null>, unknown[]>(),
  },
  skill: {
    count: jest.fn<Promise<number>, unknown[]>(),
    create: jest.fn<Promise<SkillRecord>, unknown[]>(),
    delete: jest.fn<Promise<{ id: string }>, unknown[]>(),
    findMany: jest.fn<Promise<SkillRecord[]>, unknown[]>(),
    findUnique: jest.fn<
      Promise<SkillDetailRecord | SkillRecord | { id: string } | null>,
      unknown[]
    >(),
    update: jest.fn<Promise<SkillRecord>, unknown[]>(),
  },
});

const expectAnyObject = (): object => expect.any(Object) as object;

describe('AdminSkillsService', () => {
  let prisma: AdminSkillsPrismaMock;
  let service: AdminSkillsService;

  beforeEach(async () => {
    const prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSkillsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    prisma = prismaMock;
    service = module.get<AdminSkillsService>(AdminSkillsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists skills with pagination, role category filtering, and case-insensitive search', async () => {
    const skill = makeSkill();

    prisma.skill.findMany.mockResolvedValue([skill]);
    prisma.skill.count.mockResolvedValue(21);

    const result = await service.listSkills({
      page: 2,
      perPage: 10,
      q: ' React ',
      roleCategory: RoleCategory.FRAMEWORKS,
    });

    expect(prisma.skill.findMany).toHaveBeenCalledWith({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: expectAnyObject(),
      skip: 10,
      take: 10,
      where: {
        name: {
          contains: 'React',
          mode: 'insensitive',
        },
        roleCategory: RoleCategory.FRAMEWORKS,
      },
    });
    expect(prisma.skill.count).toHaveBeenCalledWith({
      where: {
        name: {
          contains: 'React',
          mode: 'insensitive',
        },
        roleCategory: RoleCategory.FRAMEWORKS,
      },
    });
    expect(result).toEqual({
      data: [
        {
          createdAt: '2026-01-01T00:00:00.000Z',
          defaultEstimatedHours: 6.5,
          description: 'Skill description',
          id: skillId,
          name: 'React Fundamentals',
          roleCategory: RoleCategory.FRAMEWORKS,
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      meta: {
        page: 2,
        perPage: 10,
        total: 21,
        totalPages: 3,
      },
    });
  });

  it('uses default pagination when page and perPage are omitted', async () => {
    prisma.skill.findMany.mockResolvedValue([]);
    prisma.skill.count.mockResolvedValue(0);

    const result = await service.listSkills({});

    expect(prisma.skill.findMany).toHaveBeenCalledWith({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: expectAnyObject(),
      skip: 0,
      take: 20,
      where: {},
    });
    expect(result.meta).toEqual({
      page: 1,
      perPage: 20,
      total: 0,
      totalPages: 0,
    });
  });

  it('creates skills and formats the response', async () => {
    const skill = makeSkill({
      defaultEstimatedHours: 4,
      description: null,
      name: 'JWT Authentication',
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
    });

    prisma.skill.create.mockResolvedValue(skill);

    const result = await service.createSkill({
      defaultEstimatedHours: 4,
      name: 'JWT Authentication',
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
    });

    expect(prisma.skill.create).toHaveBeenCalledWith({
      data: {
        defaultEstimatedHours: 4,
        description: null,
        name: 'JWT Authentication',
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      },
      select: expectAnyObject(),
    });
    expect(result).toMatchObject({
      defaultEstimatedHours: 4,
      description: null,
      name: 'JWT Authentication',
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
    });
  });

  it('maps duplicate skill names during creation to a conflict response', async () => {
    prisma.skill.create.mockRejectedValue(makeUniqueNameError());

    await expectExceptionCode(
      service.createSkill({
        name: 'JWT Authentication',
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      }),
      ErrorCode.CONFLICT,
    );
  });

  it('gets skill details with prerequisite summaries ordered by name and id', async () => {
    const skill = {
      ...makeSkill({ name: 'NestJS Framework' }),
      prerequisites: [
        {
          prerequisiteSkill: { name: 'Node.js Basics' },
          prerequisiteSkillId: 'skill-node',
        },
        {
          prerequisiteSkill: { name: 'HTTP Basics' },
          prerequisiteSkillId: 'skill-http',
        },
      ],
    } satisfies SkillDetailRecord;

    prisma.skill.findUnique.mockResolvedValue(skill);

    const result = await service.getSkill(skillId);

    expect(prisma.skill.findUnique).toHaveBeenCalledWith({
      select: expectAnyObject(),
      where: { id: skillId },
    });
    expect(result).toMatchObject({
      id: skillId,
      name: 'NestJS Framework',
      prerequisites: [
        {
          name: 'HTTP Basics',
          skillId: 'skill-http',
        },
        {
          name: 'Node.js Basics',
          skillId: 'skill-node',
        },
      ],
    });
  });

  it('throws SkillNotFoundException when fetching a missing skill', async () => {
    prisma.skill.findUnique.mockResolvedValue(null);

    await expectExceptionCode(service.getSkill(skillId), ErrorCode.SKILL_NOT_FOUND);
  });

  it('updates only explicitly provided fields and preserves omitted fields', async () => {
    const updatedSkill = makeSkill({
      defaultEstimatedHours: null,
      description: null,
    });

    prisma.skill.findUnique.mockResolvedValue({ id: skillId });
    prisma.skill.update.mockResolvedValue(updatedSkill);

    const result = await service.updateSkill(skillId, {
      defaultEstimatedHours: null,
      description: null,
    });

    expect(prisma.skill.update).toHaveBeenCalledWith({
      data: {
        defaultEstimatedHours: null,
        description: null,
      },
      select: expectAnyObject(),
      where: { id: skillId },
    });
    expect(result).toMatchObject({
      defaultEstimatedHours: null,
      description: null,
    });
  });

  it('throws SkillNotFoundException when updating a missing skill', async () => {
    prisma.skill.findUnique.mockResolvedValue(null);

    await expectExceptionCode(
      service.updateSkill(skillId, { name: 'Updated Skill' }),
      ErrorCode.SKILL_NOT_FOUND,
    );

    expect(prisma.skill.update).not.toHaveBeenCalled();
  });

  it('maps duplicate skill names during update to a conflict response', async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: skillId });
    prisma.skill.update.mockRejectedValue(makeUniqueNameError());

    await expectExceptionCode(
      service.updateSkill(skillId, { name: 'Existing Skill' }),
      ErrorCode.CONFLICT,
    );
  });

  it('deletes unreferenced skills', async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: skillId });
    prisma.roadmapNode.findFirst.mockResolvedValue(null);
    prisma.skill.delete.mockResolvedValue({ id: skillId });

    await expect(service.deleteSkill(skillId)).resolves.toBeUndefined();

    expect(prisma.roadmapNode.findFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: { skillId },
    });
    expect(prisma.skill.delete).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: skillId },
    });
  });

  it('blocks deleting skills referenced by roadmap or template nodes', async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: skillId });
    prisma.roadmapNode.findFirst.mockResolvedValue({ id: 'node-1' });

    await expectExceptionCode(service.deleteSkill(skillId), ErrorCode.CONFLICT);

    expect(prisma.skill.delete).not.toHaveBeenCalled();
  });

  it('throws SkillNotFoundException when deleting a missing skill', async () => {
    prisma.skill.findUnique.mockResolvedValue(null);

    await expectExceptionCode(service.deleteSkill(skillId), ErrorCode.SKILL_NOT_FOUND);

    expect(prisma.roadmapNode.findFirst).not.toHaveBeenCalled();
    expect(prisma.skill.delete).not.toHaveBeenCalled();
  });
});
