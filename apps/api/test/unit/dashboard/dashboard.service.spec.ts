import type { TestingModule } from '@nestjs/testing';
import type { NodeStatus, NodeType, UserRole } from '@repo/db/prisma/client';

import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NodeStatus as NodeStatusValue, NodeType as NodeTypeValue } from '@repo/db/prisma/client';

import { UserNotFoundException } from '@/common/exceptions/app.exceptions';
import { DashboardService } from '@/modules/dashboard/dashboard.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

type AsyncMock<TResult, TArgs extends unknown[] = unknown[]> = jest.Mock<Promise<TResult>, TArgs>;

interface DailyActivityRecord {
  activityDate: Date;
  nodesCompleted: number;
}

interface DashboardRoadmapNodeRecord {
  id: string;
  nodeType: NodeType;
  estimatedHours: number | null;
  userNodeProgress: Array<{ status: NodeStatus }>;
}

interface DashboardRoadmapRecord {
  id: string;
  generatedAt: Date;
  hoursPerDay: number | null;
  nodes: DashboardRoadmapNodeRecord[];
}

interface DashboardUserRecord {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
  dailyActivity: DailyActivityRecord[];
  roadmaps: DashboardRoadmapRecord[];
}

interface DashboardPrismaMock {
  user: {
    findUnique: AsyncMock<DashboardUserRecord | null>;
  };
}

const MOCK_USER_ID = 'user-1';
const SYSTEM_NOW = new Date('2026-05-20T10:00:00Z');

const createPrismaMock = (): DashboardPrismaMock => ({
  user: {
    findUnique: jest.fn<Promise<DashboardUserRecord | null>, unknown[]>(),
  },
});

const expectObjectContaining = <T extends object>(value: T): T =>
  expect.objectContaining(value) as T;

const createUserRecord = (overrides: Partial<DashboardUserRecord> = {}): DashboardUserRecord => ({
  id: MOCK_USER_ID,
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'USER' as UserRole,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  dailyActivity: [],
  roadmaps: [],
  ...overrides,
});

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: DashboardPrismaMock;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(SYSTEM_NOW);

    const prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = prismaMock;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should query the current user dashboard payload with non-template roadmap only', async () => {
    prisma.user.findUnique.mockResolvedValue(createUserRecord());

    await service.getDashboard(MOCK_USER_ID);

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expectObjectContaining({
        where: { id: MOCK_USER_ID },
        select: expectObjectContaining({
          roadmaps: expectObjectContaining({
            where: { isTemplate: false },
            orderBy: [{ generatedAt: 'desc' }, { id: 'asc' }],
            take: 1,
          }),
        }),
      }),
    );
  });

  it('should query the current user activity payload', async () => {
    prisma.user.findUnique.mockResolvedValue(createUserRecord());

    await service.getActivitySummary(MOCK_USER_ID);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: MOCK_USER_ID },
      select: {
        dailyActivity: {
          orderBy: [{ activityDate: 'desc' }, { id: 'asc' }],
          select: {
            activityDate: true,
            nodesCompleted: true,
          },
        },
      },
    });
  });

  it('should return empty activity state with a zero-filled default range', async () => {
    prisma.user.findUnique.mockResolvedValue(createUserRecord());

    const result = await service.getActivitySummary(MOCK_USER_ID);

    expect(result.streakDays).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.activity).toHaveLength(30);
    expect(result.activity[0]).toEqual({
      activityDate: '2026-04-21',
      nodesCompleted: 0,
    });
    expect(result.activity[29]).toEqual({
      activityDate: '2026-05-20',
      nodesCompleted: 0,
    });
  });

  it('should return populated activity with current and longest streaks', async () => {
    prisma.user.findUnique.mockResolvedValue(
      createUserRecord({
        dailyActivity: [
          { activityDate: new Date('2026-05-20T00:00:00Z'), nodesCompleted: 2 },
          { activityDate: new Date('2026-05-19T00:00:00Z'), nodesCompleted: 1 },
          { activityDate: new Date('2026-05-18T00:00:00Z'), nodesCompleted: 0 },
          { activityDate: new Date('2026-05-16T00:00:00Z'), nodesCompleted: 1 },
          { activityDate: new Date('2026-05-15T00:00:00Z'), nodesCompleted: 3 },
          { activityDate: new Date('2026-05-14T00:00:00Z'), nodesCompleted: 1 },
        ],
      }),
    );

    const result = await service.getActivitySummary(MOCK_USER_ID, {
      from: '2026-05-14',
      to: '2026-05-20',
    });

    expect(result.streakDays).toBe(2);
    expect(result.longestStreak).toBe(3);
    expect(result.activity).toEqual([
      { activityDate: '2026-05-14', nodesCompleted: 1 },
      { activityDate: '2026-05-15', nodesCompleted: 3 },
      { activityDate: '2026-05-16', nodesCompleted: 1 },
      { activityDate: '2026-05-17', nodesCompleted: 0 },
      { activityDate: '2026-05-18', nodesCompleted: 0 },
      { activityDate: '2026-05-19', nodesCompleted: 1 },
      { activityDate: '2026-05-20', nodesCompleted: 2 },
    ]);
  });

  it('should default activity from date to 30 days before a custom to date', async () => {
    prisma.user.findUnique.mockResolvedValue(createUserRecord());

    const result = await service.getActivitySummary(MOCK_USER_ID, { to: '2026-05-10' });

    expect(result.activity).toHaveLength(30);
    expect(result.activity[0]?.activityDate).toBe('2026-04-11');
    expect(result.activity[29]?.activityDate).toBe('2026-05-10');
  });

  it('should reject invalid activity ranges', async () => {
    await expect(
      service.getActivitySummary(MOCK_USER_ID, {
        from: '2026-05-21',
        to: '2026-05-20',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should reject invalid activity date values', async () => {
    await expect(
      service.getActivitySummary(MOCK_USER_ID, {
        from: '2026-02-30',
        to: '2026-05-20',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should throw UserNotFoundException when the activity user is missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getActivitySummary(MOCK_USER_ID)).rejects.toThrow(UserNotFoundException);
  });

  it('should return activeRoadmap null when the user has no roadmap', async () => {
    prisma.user.findUnique.mockResolvedValue(
      createUserRecord({
        dailyActivity: [{ activityDate: new Date('2026-05-19T00:00:00Z'), nodesCompleted: 1 }],
      }),
    );

    const result = await service.getDashboard(MOCK_USER_ID);

    expect(result.activeRoadmap).toBeNull();
    expect(result.streakDays).toBe(1);
    expect(result.activityRecent).toHaveLength(30);
    expect(result.activityRecent[0]).toEqual({
      activityDate: '2026-04-21',
      nodesCompleted: 0,
    });
    expect(result.activityRecent[29]).toEqual({
      activityDate: '2026-05-20',
      nodesCompleted: 0,
    });
  });

  it('should include all progress layers for the most recent active roadmap', async () => {
    prisma.user.findUnique.mockResolvedValue(
      createUserRecord({
        dailyActivity: [
          { activityDate: new Date('2026-05-20T00:00:00Z'), nodesCompleted: 1 },
          { activityDate: new Date('2026-05-19T00:00:00Z'), nodesCompleted: 2 },
          { activityDate: new Date('2026-05-18T00:00:00Z'), nodesCompleted: 0 },
        ],
        roadmaps: [
          {
            id: 'roadmap-1',
            generatedAt: new Date('2026-05-19T00:00:00Z'),
            hoursPerDay: null,
            nodes: [
              {
                id: 'group-1',
                nodeType: NodeTypeValue.GROUP,
                estimatedHours: null,
                userNodeProgress: [{ status: NodeStatusValue.COMPLETED }],
              },
              {
                id: 'required-1',
                nodeType: NodeTypeValue.REQUIRED,
                estimatedHours: 2,
                userNodeProgress: [{ status: NodeStatusValue.COMPLETED }],
              },
              {
                id: 'required-2',
                nodeType: NodeTypeValue.REQUIRED,
                estimatedHours: 4,
                userNodeProgress: [{ status: NodeStatusValue.IN_PROGRESS }],
              },
              {
                id: 'optional-1',
                nodeType: NodeTypeValue.OPTIONAL,
                estimatedHours: 3,
                userNodeProgress: [{ status: NodeStatusValue.COMPLETED }],
              },
            ],
          },
        ],
      }),
    );

    const result = await service.getDashboard(MOCK_USER_ID);

    expect(result.activeRoadmap).toEqual({
      roadmapId: 'roadmap-1',
      completionPct: 75,
      streakDays: 2,
      skillReadinessPct: 50,
      nodesTotal: 4,
      nodesCompleted: 3,
      timelineWarning: null,
    });
    expect(result.streakDays).toBe(2);
  });

  it('should skip today when today has no completed nodes and count from yesterday', async () => {
    prisma.user.findUnique.mockResolvedValue(
      createUserRecord({
        dailyActivity: [
          { activityDate: new Date('2026-05-20T00:00:00Z'), nodesCompleted: 0 },
          { activityDate: new Date('2026-05-19T00:00:00Z'), nodesCompleted: 2 },
          { activityDate: new Date('2026-05-18T00:00:00Z'), nodesCompleted: 1 },
          { activityDate: new Date('2026-05-17T00:00:00Z'), nodesCompleted: 0 },
          { activityDate: new Date('2026-05-16T00:00:00Z'), nodesCompleted: 1 },
        ],
      }),
    );

    const result = await service.getDashboard(MOCK_USER_ID);

    expect(result.streakDays).toBe(2);
  });

  it('should throw UserNotFoundException when user is missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getDashboard(MOCK_USER_ID)).rejects.toThrow(UserNotFoundException);
  });
});
