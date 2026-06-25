import type { TestingModule } from '@nestjs/testing';

import { HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ResourceType } from '@repo/db/prisma/client';

import { ErrorCode } from '@/common/constants/error-codes';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AdminSkillResourcesService } from '@/modules/skills/admin-skill-resources.service';

type AsyncMock<TResult = unknown, TArgs extends unknown[] = unknown[]> = jest.Mock<
  Promise<TResult>,
  TArgs
>;

interface ResourceRecord {
  createdAt: Date;
  id: number;
  isFree: boolean;
  isPrimary: boolean;
  resourceType: ResourceType;
  skillId: string;
  title: string;
  updatedAt: Date;
  url: string;
}

interface TxMock {
  resource: {
    count: AsyncMock<number>;
    create: AsyncMock<ResourceRecord>;
    findMany: AsyncMock<Array<{ id: number }>>;
    findFirst: AsyncMock<ResourceRecord | null>;
    update: AsyncMock<ResourceRecord | { id: number }>;
  };
  skill: {
    findUnique: AsyncMock<{ id: string } | null>;
  };
}

interface AdminSkillResourcesPrismaMock {
  $transaction: AsyncMock<unknown, [unknown]>;
  resource: {
    deleteMany: AsyncMock<{ count: number }>;
    findMany: AsyncMock<ResourceRecord[]>;
  };
  skill: {
    findUnique: AsyncMock<{ id: string } | null>;
  };
}

const skillId = 'skill-1';
const resourceId = 12;

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

const makeResource = (overrides: Partial<ResourceRecord> = {}): ResourceRecord => ({
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  id: resourceId,
  isFree: true,
  isPrimary: false,
  resourceType: ResourceType.DOCS,
  skillId,
  title: 'Official docs',
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  url: 'https://example.test/docs',
  ...overrides,
});

const expectAnyObject = (): object => expect.any(Object) as object;

const makeTxMock = (): TxMock => ({
  resource: {
    count: jest.fn<Promise<number>, unknown[]>(),
    create: jest.fn<Promise<ResourceRecord>, unknown[]>(),
    findMany: jest.fn<Promise<Array<{ id: number }>>, unknown[]>(),
    findFirst: jest.fn<Promise<ResourceRecord | null>, unknown[]>(),
    update: jest.fn<Promise<ResourceRecord | { id: number }>, unknown[]>(),
  },
  skill: {
    findUnique: jest.fn<Promise<{ id: string } | null>, unknown[]>(),
  },
});

const createPrismaMock = (txMock: TxMock): AdminSkillResourcesPrismaMock => ({
  $transaction: jest.fn<Promise<unknown>, [unknown]>().mockImplementation((input) => {
    const callback = input as (tx: TxMock) => unknown;

    return Promise.resolve(callback(txMock));
  }),
  resource: {
    deleteMany: jest.fn<Promise<{ count: number }>, unknown[]>(),
    findMany: jest.fn<Promise<ResourceRecord[]>, unknown[]>(),
  },
  skill: {
    findUnique: jest.fn<Promise<{ id: string } | null>, unknown[]>(),
  },
});

describe('AdminSkillResourcesService', () => {
  let prisma: AdminSkillResourcesPrismaMock;
  let service: AdminSkillResourcesService;
  let txMock: TxMock;

  beforeEach(async () => {
    txMock = makeTxMock();
    const prismaMock = createPrismaMock(txMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSkillResourcesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    prisma = prismaMock;
    service = module.get<AdminSkillResourcesService>(AdminSkillResourcesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists resources ordered by existing ordering fallback', async () => {
    const primary = makeResource({ id: 2, isPrimary: true, title: 'Primary docs' });
    const secondary = makeResource({ id: 1, isPrimary: false, title: 'Article' });

    prisma.skill.findUnique.mockResolvedValue({ id: skillId });
    prisma.resource.findMany.mockResolvedValue([primary, secondary]);

    const result = await service.listResources(skillId);

    expect(prisma.resource.findMany).toHaveBeenCalledWith({
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
      select: expectAnyObject(),
      where: { skillId },
    });
    expect(result).toEqual({
      resources: [
        expect.objectContaining({
          createdAt: '2026-01-01T00:00:00.000Z',
          id: 2,
          isPrimary: true,
          title: 'Primary docs',
        }),
        expect.objectContaining({
          id: 1,
          isPrimary: false,
          title: 'Article',
          updatedAt: '2026-01-02T00:00:00.000Z',
        }),
      ],
      skillId: skillId,
    });
  });

  it('creates resources with default free and primary flags', async () => {
    const resource = makeResource({ isFree: true, isPrimary: false });

    txMock.skill.findUnique.mockResolvedValue({ id: skillId });
    txMock.resource.count.mockResolvedValue(2);
    txMock.resource.create.mockResolvedValue(resource);

    const result = await service.createResource(skillId, {
      resourceType: ResourceType.DOCS,
      title: 'Official docs',
      url: 'https://example.test/docs',
    });

    expect(txMock.resource.create).toHaveBeenCalledWith({
      data: {
        isFree: true,
        isPrimary: false,
        resourceType: ResourceType.DOCS,
        skillId,
        title: 'Official docs',
        url: 'https://example.test/docs',
      },
      select: expectAnyObject(),
    });
    expect(result).toMatchObject({
      id: resourceId,
      isFree: true,
      isPrimary: false,
      resourceType: ResourceType.DOCS,
    });
  });

  it('creates a primary resource when fewer than 2 primary resources exist', async () => {
    const resource = makeResource({ isPrimary: true });

    txMock.skill.findUnique.mockResolvedValue({ id: skillId });
    txMock.resource.count.mockResolvedValue(1);
    txMock.resource.create.mockResolvedValue(resource);

    const result = await service.createResource(skillId, {
      isPrimary: true,
      resourceType: ResourceType.DOCS,
      title: 'Official docs',
      url: 'https://example.test/docs',
    });

    expect(txMock.resource.count).toHaveBeenCalledWith({
      where: {
        isPrimary: true,
        skillId,
      },
    });
    expect(txMock.resource.create).toHaveBeenCalledWith({
      data: {
        isFree: true,
        isPrimary: true,
        resourceType: ResourceType.DOCS,
        skillId,
        title: 'Official docs',
        url: 'https://example.test/docs',
      },
      select: expectAnyObject(),
    });
    expect(result).toMatchObject({ isPrimary: true });
  });

  it('throws SkillPrimaryResourcesLimitException when creating a third primary resource', async () => {
    txMock.skill.findUnique.mockResolvedValue({ id: skillId });
    txMock.resource.count.mockResolvedValue(2);

    await expectExceptionCode(
      service.createResource(skillId, {
        isPrimary: true,
        resourceType: ResourceType.DOCS,
        title: 'Official docs',
        url: 'https://example.test/docs',
      }),
      ErrorCode.SKILL_PRIMARY_RESOURCES_LIMIT,
    );

    expect(txMock.resource.create).not.toHaveBeenCalled();
  });

  it('allows updating a non-primary resource to primary when fewer than 2 primary resources exist', async () => {
    const updatedResource = makeResource({ isPrimary: true });

    txMock.skill.findUnique.mockResolvedValue({ id: skillId });
    txMock.resource.findFirst.mockResolvedValue(makeResource({ isPrimary: false }));
    txMock.resource.count.mockResolvedValue(1);
    txMock.resource.update.mockResolvedValue(updatedResource);

    const result = await service.updateResource(skillId, resourceId, { isPrimary: true });

    expect(txMock.resource.count).toHaveBeenCalledWith({
      where: {
        id: { not: resourceId },
        isPrimary: true,
        skillId,
      },
    });
    expect(txMock.resource.update).toHaveBeenCalledWith({
      data: {
        isPrimary: true,
      },
      select: expectAnyObject(),
      where: { id: resourceId },
    });
    expect(result).toMatchObject({ isPrimary: true });
  });

  it('throws SkillPrimaryResourcesLimitException when updating a third resource to primary', async () => {
    txMock.skill.findUnique.mockResolvedValue({ id: skillId });
    txMock.resource.findFirst.mockResolvedValue(makeResource({ isPrimary: false }));
    txMock.resource.count.mockResolvedValue(2);

    await expectExceptionCode(
      service.updateResource(skillId, resourceId, { isPrimary: true }),
      ErrorCode.SKILL_PRIMARY_RESOURCES_LIMIT,
    );

    expect(txMock.resource.update).not.toHaveBeenCalled();
  });

  it('allows updating an existing primary resource without false-positive primary conflicts', async () => {
    const updatedResource = makeResource({ isPrimary: true, title: 'Updated docs' });

    txMock.skill.findUnique.mockResolvedValue({ id: skillId });
    txMock.resource.findFirst.mockResolvedValue(makeResource({ isPrimary: true }));
    txMock.resource.update.mockResolvedValue(updatedResource);

    const result = await service.updateResource(skillId, resourceId, {
      isPrimary: true,
      title: 'Updated docs',
    });

    expect(txMock.resource.update).toHaveBeenCalledWith({
      data: {
        isPrimary: true,
        title: 'Updated docs',
      },
      select: expectAnyObject(),
      where: { id: resourceId },
    });
    expect(txMock.resource.count).not.toHaveBeenCalled();
    expect(result).toMatchObject({ isPrimary: true, title: 'Updated docs' });
  });

  it('throws SkillNotFoundException for missing skills', async () => {
    txMock.skill.findUnique.mockResolvedValue(null);

    await expectExceptionCode(
      service.createResource(skillId, {
        resourceType: ResourceType.DOCS,
        title: 'Official docs',
        url: 'https://example.test/docs',
      }),
      ErrorCode.SKILL_NOT_FOUND,
    );

    expect(txMock.resource.create).not.toHaveBeenCalled();
  });

  it('throws ResourceNotFoundException for missing or cross-skill resources', async () => {
    txMock.skill.findUnique.mockResolvedValue({ id: skillId });
    txMock.resource.findFirst.mockResolvedValue(null);

    await expectExceptionCode(
      service.updateResource(skillId, resourceId, { title: 'Updated docs' }),
      ErrorCode.RESOURCE_NOT_FOUND,
    );

    expect(txMock.resource.update).not.toHaveBeenCalled();
  });

  it('deletes resources by id and skill id', async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: skillId });
    prisma.resource.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.deleteResource(skillId, resourceId)).resolves.toBeUndefined();

    expect(prisma.resource.deleteMany).toHaveBeenCalledWith({
      where: {
        id: resourceId,
        skillId,
      },
    });
  });

  it('throws ResourceNotFoundException when delete does not match a resource', async () => {
    prisma.skill.findUnique.mockResolvedValue({ id: skillId });
    prisma.resource.deleteMany.mockResolvedValue({ count: 0 });

    await expectExceptionCode(
      service.deleteResource(skillId, resourceId),
      ErrorCode.RESOURCE_NOT_FOUND,
    );
  });
});
