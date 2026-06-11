import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';

import { PrismaService } from '@/modules/prisma/prisma.service';
import { SyncService } from '@/modules/sync/sync.service';

type AsyncMock<TResult = unknown, TArgs extends unknown[] = unknown[]> = jest.Mock<
  Promise<TResult>,
  TArgs
>;

interface SyncPrismaMock {
  $transaction: AsyncMock<unknown[], [unknown[]]>;
  resource: {
    aggregate: AsyncMock<{ _max: { updatedAt: Date | null } }>;
  };
  roadmap: {
    aggregate: AsyncMock<{ _max: { updatedAt: Date | null } }>;
  };
  skill: {
    aggregate: AsyncMock<{ _max: { updatedAt: Date | null } }>;
  };
}

const createPrismaMock = (): SyncPrismaMock => ({
  $transaction: jest.fn<Promise<unknown[]>, [unknown[]]>().mockImplementation(async (input) => {
    return Promise.all(input as Promise<unknown>[]);
  }),
  resource: {
    aggregate: jest.fn<Promise<{ _max: { updatedAt: Date | null } }>, unknown[]>(),
  },
  roadmap: {
    aggregate: jest.fn<Promise<{ _max: { updatedAt: Date | null } }>, unknown[]>(),
  },
  skill: {
    aggregate: jest.fn<Promise<{ _max: { updatedAt: Date | null } }>, unknown[]>(),
  },
});

describe('SyncService', () => {
  let prisma: SyncPrismaMock;
  let service: SyncService;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return max updatedAt timestamps for static sync resources', async () => {
    prisma.roadmap.aggregate.mockResolvedValue({
      _max: { updatedAt: new Date('2026-06-11T10:00:00.000Z') },
    });
    prisma.skill.aggregate.mockResolvedValue({
      _max: { updatedAt: new Date('2026-06-01T08:00:00.000Z') },
    });
    prisma.resource.aggregate.mockResolvedValue({
      _max: { updatedAt: new Date('2026-05-20T12:00:00.000Z') },
    });

    const result = await service.getVersions();

    expect(prisma.roadmap.aggregate).toHaveBeenCalledWith({
      _max: { updatedAt: true },
      where: { isTemplate: true },
    });
    expect(prisma.skill.aggregate).toHaveBeenCalledWith({
      _max: { updatedAt: true },
    });
    expect(prisma.resource.aggregate).toHaveBeenCalledWith({
      _max: { updatedAt: true },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      roadmaps: '2026-06-11T10:00:00.000Z',
      skills: '2026-06-01T08:00:00.000Z',
      resources: '2026-05-20T12:00:00.000Z',
    });
  });

  it('should return null for empty datasets', async () => {
    prisma.roadmap.aggregate.mockResolvedValue({ _max: { updatedAt: null } });
    prisma.skill.aggregate.mockResolvedValue({ _max: { updatedAt: null } });
    prisma.resource.aggregate.mockResolvedValue({ _max: { updatedAt: null } });

    await expect(service.getVersions()).resolves.toEqual({
      roadmaps: null,
      skills: null,
      resources: null,
    });
  });
});
