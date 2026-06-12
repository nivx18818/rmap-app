import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';

import { AdminDashboardService } from '@/modules/dashboard/admin-dashboard.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

type AsyncMock<TResult = unknown, TArgs extends unknown[] = unknown[]> = jest.Mock<
  Promise<TResult>,
  TArgs
>;

interface AdminDashboardPrismaMock {
  $transaction: AsyncMock<unknown[], [unknown[]]>;
  resource: {
    count: AsyncMock<number>;
    findMany: AsyncMock<Array<{ id: number; title: string; updatedAt: Date }>>;
  };
  roadmap: {
    count: AsyncMock<number>;
    findMany: AsyncMock<Array<{ id: string; title: string; updatedAt: Date }>>;
  };
  roadmapNode: {
    count: AsyncMock<number>;
    findMany: AsyncMock<Array<{ createdAt: Date; id: string; name: string }>>;
  };
  skill: {
    count: AsyncMock<number>;
    findMany: AsyncMock<Array<{ id: string; name: string; updatedAt: Date }>>;
  };
}

const createPrismaMock = (): AdminDashboardPrismaMock => ({
  $transaction: jest.fn<Promise<unknown[]>, [unknown[]]>().mockImplementation((input) => {
    return Promise.all(input);
  }),
  resource: {
    count: jest.fn<Promise<number>, unknown[]>(),
    findMany: jest.fn<Promise<Array<{ id: number; title: string; updatedAt: Date }>>, unknown[]>(),
  },
  roadmap: {
    count: jest.fn<Promise<number>, unknown[]>(),
    findMany: jest.fn<Promise<Array<{ id: string; title: string; updatedAt: Date }>>, unknown[]>(),
  },
  roadmapNode: {
    count: jest.fn<Promise<number>, unknown[]>(),
    findMany: jest.fn<Promise<Array<{ createdAt: Date; id: string; name: string }>>, unknown[]>(),
  },
  skill: {
    count: jest.fn<Promise<number>, unknown[]>(),
    findMany: jest.fn<Promise<Array<{ id: string; name: string; updatedAt: Date }>>, unknown[]>(),
  },
});

describe('AdminDashboardService', () => {
  let prisma: AdminDashboardPrismaMock;
  let service: AdminDashboardService;

  beforeEach(async () => {
    const prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminDashboardService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    prisma = prismaMock;
    service = module.get<AdminDashboardService>(AdminDashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns admin totals and recent content activity ordered by timestamp', async () => {
    prisma.skill.count.mockResolvedValue(2);
    prisma.roadmap.count.mockResolvedValue(3);
    prisma.resource.count.mockResolvedValue(4);
    prisma.roadmapNode.count.mockResolvedValue(5);
    prisma.skill.findMany.mockResolvedValue([
      {
        id: 'skill-1',
        name: 'React',
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ]);
    prisma.roadmap.findMany.mockResolvedValue([
      {
        id: 'template-1',
        title: 'Frontend path',
        updatedAt: new Date('2026-01-04T00:00:00.000Z'),
      },
    ]);
    prisma.resource.findMany.mockResolvedValue([
      {
        id: 7,
        title: 'React Docs',
        updatedAt: new Date('2026-01-03T00:00:00.000Z'),
      },
    ]);
    prisma.roadmapNode.findMany.mockResolvedValue([
      {
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        id: 'node-1',
        name: 'Hooks',
      },
    ]);

    const result = await service.getDashboard();

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.roadmap.count).toHaveBeenCalledWith({ where: { isTemplate: true } });
    expect(prisma.roadmapNode.count).toHaveBeenCalledWith({
      where: { roadmap: { isTemplate: true } },
    });
    expect(result).toEqual({
      recentActivity: [
        {
          id: 'template-1',
          label: 'Frontend path',
          timestamp: '2026-01-04T00:00:00.000Z',
          type: 'template',
        },
        {
          id: '7',
          label: 'React Docs',
          timestamp: '2026-01-03T00:00:00.000Z',
          type: 'resource',
        },
        {
          id: 'skill-1',
          label: 'React',
          timestamp: '2026-01-02T00:00:00.000Z',
          type: 'skill',
        },
        {
          id: 'node-1',
          label: 'Hooks',
          timestamp: '2026-01-01T00:00:00.000Z',
          type: 'template_node',
        },
      ],
      totals: {
        resources: 4,
        skills: 2,
        templateNodes: 5,
        templates: 3,
      },
    });
  });
});
