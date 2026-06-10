import type { TestingModule } from '@nestjs/testing';

import { HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RoleCategory } from '@repo/db/prisma/client';
import { PrismaClientKnownRequestError } from '@repo/db/prisma/internal/prismaNamespace';

import { ErrorCode } from '@/common/constants/error-codes';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AdminSkillPrerequisitesService } from '@/modules/skills/admin-skill-prerequisites.service';

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

interface SkillPrerequisiteRecord {
  prerequisiteSkill: SkillRecord;
}

interface EdgeRecord {
  prerequisiteSkillId: string;
  skillId: string;
}

interface TxMock {
  skill: {
    findUnique: AsyncMock<{ id: string } | null>;
  };
  skillPrerequisite: {
    create: AsyncMock<EdgeRecord>;
    findMany: AsyncMock<Array<Pick<EdgeRecord, 'prerequisiteSkillId'>>>;
    findUnique: AsyncMock<EdgeRecord | null>;
  };
}

interface AdminSkillPrerequisitesPrismaMock {
  $transaction: AsyncMock<unknown, [unknown]>;
  skill: {
    findUnique: AsyncMock<{ id: string } | null>;
  };
  skillPrerequisite: {
    deleteMany: AsyncMock<{ count: number }>;
    findMany: AsyncMock<SkillPrerequisiteRecord[]>;
  };
}

const skillId = 'skill-1';
const prereqSkillId = 'skill-2';
const transitiveSkillId = 'skill-3';

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
  id: prereqSkillId,
  name: 'React Fundamentals',
  roleCategory: RoleCategory.FRAMEWORKS,
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  ...overrides,
});

const makeDuplicateEdgeError = (): PrismaClientKnownRequestError =>
  new PrismaClientKnownRequestError('Unique failed', {
    clientVersion: 'test',
    code: 'P2002',
    meta: { target: ['skillId', 'prerequisiteSkillId'] },
  });

const makeTxMock = (): TxMock => ({
  skill: {
    findUnique: jest.fn<Promise<{ id: string } | null>, unknown[]>(),
  },
  skillPrerequisite: {
    create: jest.fn<Promise<EdgeRecord>, unknown[]>(),
    findMany: jest.fn<Promise<Array<Pick<EdgeRecord, 'prerequisiteSkillId'>>>, unknown[]>(),
    findUnique: jest.fn<Promise<EdgeRecord | null>, unknown[]>(),
  },
});

const createPrismaMock = (txMock: TxMock): AdminSkillPrerequisitesPrismaMock => ({
  $transaction: jest.fn<Promise<unknown>, [unknown]>().mockImplementation((input) => {
    const callback = input as (tx: TxMock) => unknown;

    return Promise.resolve(callback(txMock));
  }),
  skill: {
    findUnique: jest.fn<Promise<{ id: string } | null>, unknown[]>(),
  },
  skillPrerequisite: {
    deleteMany: jest.fn<Promise<{ count: number }>, unknown[]>(),
    findMany: jest.fn<Promise<SkillPrerequisiteRecord[]>, unknown[]>(),
  },
});

const expectAnyObject = (): object => expect.any(Object) as object;

describe('AdminSkillPrerequisitesService', () => {
  let prisma: AdminSkillPrerequisitesPrismaMock;
  let service: AdminSkillPrerequisitesService;
  let txMock: TxMock;

  beforeEach(async () => {
    txMock = makeTxMock();
    const prismaMock = createPrismaMock(txMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSkillPrerequisitesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    prisma = prismaMock;
    service = module.get<AdminSkillPrerequisitesService>(AdminSkillPrerequisitesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists prerequisites ordered by prerequisite skill name and id with full skill responses', async () => {
    const alpha = makeSkill({
      defaultEstimatedHours: 2,
      id: 'skill-alpha',
      name: 'Alpha Basics',
      roleCategory: RoleCategory.WEB_DEVELOPMENT,
    });
    const beta = makeSkill({
      defaultEstimatedHours: null,
      description: null,
      id: 'skill-beta',
      name: 'Beta Basics',
      roleCategory: null,
    });

    prisma.skill.findUnique.mockResolvedValue({ id: skillId });
    prisma.skillPrerequisite.findMany.mockResolvedValue([
      { prerequisiteSkill: alpha },
      { prerequisiteSkill: beta },
    ]);

    const result = await service.listPrerequisites(skillId);

    expect(prisma.skillPrerequisite.findMany).toHaveBeenCalledWith({
      orderBy: [{ prerequisiteSkill: { name: 'asc' } }, { prerequisiteSkillId: 'asc' }],
      select: {
        prerequisiteSkill: {
          select: expectAnyObject(),
        },
      },
      where: { skillId },
    });
    expect(result).toEqual({
      prerequisites: [
        {
          createdAt: '2026-01-01T00:00:00.000Z',
          defaultEstimatedHours: 2,
          description: 'Skill description',
          id: 'skill-alpha',
          name: 'Alpha Basics',
          roleCategory: RoleCategory.WEB_DEVELOPMENT,
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
        {
          createdAt: '2026-01-01T00:00:00.000Z',
          defaultEstimatedHours: null,
          description: null,
          id: 'skill-beta',
          name: 'Beta Basics',
          roleCategory: null,
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ],
      skillId,
    });
  });

  it('throws SkillNotFoundException when listing prerequisites for a missing target skill', async () => {
    prisma.skill.findUnique.mockResolvedValue(null);

    await expectExceptionCode(service.listPrerequisites(skillId), ErrorCode.SKILL_NOT_FOUND);

    expect(prisma.skillPrerequisite.findMany).not.toHaveBeenCalled();
  });

  it('creates a prerequisite edge after both skills exist', async () => {
    txMock.skill.findUnique.mockResolvedValue({ id: skillId });
    txMock.skillPrerequisite.findUnique.mockResolvedValue(null);
    txMock.skillPrerequisite.findMany.mockResolvedValue([]);
    txMock.skillPrerequisite.create.mockResolvedValue({
      prerequisiteSkillId: prereqSkillId,
      skillId,
    });

    await expect(
      service.createPrerequisite(skillId, { prerequisiteSkillId: prereqSkillId }),
    ).resolves.toBeUndefined();

    expect(txMock.skill.findUnique).toHaveBeenCalledTimes(2);
    expect(txMock.skillPrerequisite.create).toHaveBeenCalledWith({
      data: {
        prerequisiteSkillId: prereqSkillId,
        skillId,
      },
      select: {
        prerequisiteSkillId: true,
        skillId: true,
      },
    });
  });

  it('throws SkillNotFoundException when creating for a missing target skill', async () => {
    txMock.skill.findUnique.mockResolvedValueOnce(null);

    await expectExceptionCode(
      service.createPrerequisite(skillId, { prerequisiteSkillId: prereqSkillId }),
      ErrorCode.SKILL_NOT_FOUND,
    );

    expect(txMock.skillPrerequisite.create).not.toHaveBeenCalled();
  });

  it('throws SkillNotFoundException when creating with a missing prerequisite skill', async () => {
    txMock.skill.findUnique.mockResolvedValueOnce({ id: skillId }).mockResolvedValueOnce(null);

    await expectExceptionCode(
      service.createPrerequisite(skillId, { prerequisiteSkillId: prereqSkillId }),
      ErrorCode.SKILL_NOT_FOUND,
    );

    expect(txMock.skillPrerequisite.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate prerequisite edges', async () => {
    txMock.skill.findUnique.mockResolvedValue({ id: skillId });
    txMock.skillPrerequisite.findUnique.mockResolvedValue({
      prerequisiteSkillId: prereqSkillId,
      skillId,
    });

    await expectExceptionCode(
      service.createPrerequisite(skillId, { prerequisiteSkillId: prereqSkillId }),
      ErrorCode.SKILL_PREREQUISITE_ALREADY_EXISTS,
    );

    expect(txMock.skillPrerequisite.create).not.toHaveBeenCalled();
  });

  it('maps duplicate edge races from Prisma to conflict responses', async () => {
    txMock.skill.findUnique.mockResolvedValue({ id: skillId });
    txMock.skillPrerequisite.findUnique.mockResolvedValue(null);
    txMock.skillPrerequisite.findMany.mockResolvedValue([]);
    txMock.skillPrerequisite.create.mockRejectedValue(makeDuplicateEdgeError());

    await expectExceptionCode(
      service.createPrerequisite(skillId, { prerequisiteSkillId: prereqSkillId }),
      ErrorCode.SKILL_PREREQUISITE_ALREADY_EXISTS,
    );
  });

  it('rejects self-prerequisites', async () => {
    txMock.skill.findUnique.mockResolvedValue({ id: skillId });

    await expectExceptionCode(
      service.createPrerequisite(skillId, { prerequisiteSkillId: skillId }),
      ErrorCode.SKILL_PREREQUISITE_SELF_REFERENCE,
    );

    expect(txMock.skillPrerequisite.create).not.toHaveBeenCalled();
  });

  it('rejects direct cycles', async () => {
    txMock.skill.findUnique.mockResolvedValue({ id: skillId });
    txMock.skillPrerequisite.findUnique.mockResolvedValue(null);
    txMock.skillPrerequisite.findMany.mockResolvedValue([{ prerequisiteSkillId: skillId }]);

    await expectExceptionCode(
      service.createPrerequisite(skillId, { prerequisiteSkillId: prereqSkillId }),
      ErrorCode.SKILL_PREREQUISITE_CYCLE,
    );

    expect(txMock.skillPrerequisite.create).not.toHaveBeenCalled();
  });

  it('rejects transitive cycles', async () => {
    txMock.skill.findUnique.mockResolvedValue({ id: skillId });
    txMock.skillPrerequisite.findUnique.mockResolvedValue(null);
    txMock.skillPrerequisite.findMany
      .mockResolvedValueOnce([{ prerequisiteSkillId: transitiveSkillId }])
      .mockResolvedValueOnce([{ prerequisiteSkillId: skillId }]);

    await expectExceptionCode(
      service.createPrerequisite(skillId, { prerequisiteSkillId: prereqSkillId }),
      ErrorCode.SKILL_PREREQUISITE_CYCLE,
    );

    expect(txMock.skillPrerequisite.create).not.toHaveBeenCalled();
  });

  it('deletes an existing prerequisite edge', async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: skillId });
    prisma.skillPrerequisite.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.deletePrerequisite(skillId, prereqSkillId)).resolves.toBeUndefined();

    expect(prisma.skill.findUnique).toHaveBeenCalledTimes(2);
    expect(prisma.skillPrerequisite.deleteMany).toHaveBeenCalledWith({
      where: {
        prerequisiteSkillId: prereqSkillId,
        skillId,
      },
    });
  });

  it('throws SkillPrerequisiteNotFoundException when deleting a missing prerequisite edge', async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: skillId });
    prisma.skillPrerequisite.deleteMany.mockResolvedValue({ count: 0 });

    await expectExceptionCode(
      service.deletePrerequisite(skillId, prereqSkillId),
      ErrorCode.SKILL_PREREQUISITE_NOT_FOUND,
    );
  });

  it('throws SkillNotFoundException when deleting with a missing target skill', async () => {
    prisma.skill.findUnique.mockResolvedValueOnce(null);

    await expectExceptionCode(
      service.deletePrerequisite(skillId, prereqSkillId),
      ErrorCode.SKILL_NOT_FOUND,
    );

    expect(prisma.skillPrerequisite.deleteMany).not.toHaveBeenCalled();
  });

  it('throws SkillNotFoundException when deleting with a missing prerequisite skill', async () => {
    prisma.skill.findUnique.mockResolvedValueOnce({ id: skillId }).mockResolvedValueOnce(null);

    await expectExceptionCode(
      service.deletePrerequisite(skillId, prereqSkillId),
      ErrorCode.SKILL_NOT_FOUND,
    );

    expect(prisma.skillPrerequisite.deleteMany).not.toHaveBeenCalled();
  });
});
