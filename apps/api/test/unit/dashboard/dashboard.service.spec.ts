import type { TestingModule } from '@nestjs/testing';
import type { NodeStatus, NodeType, RoleCategory, UserRole } from '@repo/db/prisma/client';

import { HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NodeStatus as NodeStatusValue, NodeType as NodeTypeValue } from '@repo/db/prisma/client';

import { ErrorCode } from '@/common/constants/error-codes';
import {
  ActivityDateInvalidException,
  ActivityDateRangeInvalidException,
  UserNotFoundException,
} from '@/common/exceptions/app.exceptions';
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
  userNodeProgress: Array<{ startedAt: Date | null; status: NodeStatus }>;
}

interface DashboardRoadmapRecord {
  deadlineDate: Date | null;
  description: string | null;
  estimatedWeeks: number | null;
  id: string;
  generatedAt: Date;
  goalName: string | null;
  hoursPerDay: number | null;
  isTemplate: boolean;
  nodes: DashboardRoadmapNodeRecord[];
  roleCategory: RoleCategory;
  title: string;
  updatedAt: Date;
  userId: string | null;
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
  $transaction: AsyncMock<[DashboardRoadmapRecord[], DashboardRoadmapRecord[]], [unknown[]]>;
  roadmap: {
    findMany: AsyncMock<DashboardRoadmapRecord[]>;
  };
  user: {
    findUnique: AsyncMock<DashboardUserRecord | null>;
  };
}

const MOCK_USER_ID = 'user-1';
const SYSTEM_NOW = new Date('2026-05-20T10:00:00Z');

const createPrismaMock = (): DashboardPrismaMock => ({
  $transaction: jest
    .fn<Promise<[DashboardRoadmapRecord[], DashboardRoadmapRecord[]]>, [unknown[]]>()
    .mockImplementation(
      async (items) =>
        Promise.all(items) as Promise<[DashboardRoadmapRecord[], DashboardRoadmapRecord[]]>,
    ),
  roadmap: {
    findMany: jest.fn<Promise<DashboardRoadmapRecord[]>, unknown[]>().mockResolvedValue([]),
  },
  user: {
    findUnique: jest.fn<Promise<DashboardUserRecord | null>, unknown[]>(),
  },
});

const expectObjectContaining = <T extends object>(value: T): T =>
  expect.objectContaining(value) as T;

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

  const response = caught.getResponse();

  if (typeof response !== 'object' || response === null) {
    throw new Error('Expected exception response to be an object');
  }

  expect(response).toMatchObject({ code });
};

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

const createRoadmapRecord = (
  overrides: Partial<DashboardRoadmapRecord> = {},
): DashboardRoadmapRecord => ({
  deadlineDate: null,
  description: 'A roadmap',
  estimatedWeeks: 6,
  generatedAt: new Date('2026-05-19T00:00:00Z'),
  goalName: 'Backend Engineer',
  hoursPerDay: null,
  id: 'roadmap-1',
  isTemplate: false,
  nodes: [],
  roleCategory: 'WEB_DEVELOPMENT' as RoleCategory,
  title: 'Backend roadmap',
  updatedAt: new Date('2026-05-19T00:00:00Z'),
  userId: MOCK_USER_ID,
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

  it('should query dashboard payload with active template and user roadmaps', async () => {
    prisma.user.findUnique.mockResolvedValue(createUserRecord());

    await service.getDashboard(MOCK_USER_ID);

    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expectObjectContaining({
        where: { id: MOCK_USER_ID },
        select: expectObjectContaining({
          dailyActivity: expect.any(Object) as object,
        }),
      }),
    );
    expect(prisma.roadmap.findMany).toHaveBeenNthCalledWith(
      1,
      expectObjectContaining({
        where: {
          OR: [
            { isTemplate: false, userId: MOCK_USER_ID },
            {
              isTemplate: true,
              nodes: {
                some: {
                  userNodeProgress: {
                    some: {
                      startedAt: { not: null },
                      userId: MOCK_USER_ID,
                    },
                  },
                },
              },
            },
          ],
        },
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
    const promise = service.getActivitySummary(MOCK_USER_ID, {
      from: '2026-05-21',
      to: '2026-05-20',
    });

    await expect(promise).rejects.toThrow(ActivityDateRangeInvalidException);
    await expectExceptionCode(promise, ErrorCode.ACTIVITY_DATE_RANGE_INVALID);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should reject invalid activity date values', async () => {
    const promise = service.getActivitySummary(MOCK_USER_ID, {
      from: '2026-02-30',
      to: '2026-05-20',
    });

    await expect(promise).rejects.toThrow(ActivityDateInvalidException);
    await expectExceptionCode(promise, ErrorCode.ACTIVITY_DATE_INVALID);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should throw UserNotFoundException when the activity user is missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getActivitySummary(MOCK_USER_ID)).rejects.toThrow(UserNotFoundException);
  });

  it('should return empty roadmap state when the user has no roadmap', async () => {
    prisma.user.findUnique.mockResolvedValue(
      createUserRecord({
        dailyActivity: [{ activityDate: new Date('2026-05-19T00:00:00Z'), nodesCompleted: 1 }],
      }),
    );

    const result = await service.getDashboard(MOCK_USER_ID);

    expect(result.roadmaps).toEqual([]);
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
    expect(result.summary).toEqual({
      totalRoadmaps: 0,
      activeRoadmaps: 0,
      completedRoadmaps: 0,
      totalSkills: 0,
      completedSkills: 0,
      inProgressSkills: 0,
      lockedSkills: 0,
      currentStreak: 1,
    });
    expect(result.skillCategories).toEqual([]);
    expect(result.roadmapStatus).toEqual({
      behindPace: 0,
      onTrack: 0,
      completed: 0,
      notStarted: 0,
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
      }),
    );
    prisma.roadmap.findMany.mockResolvedValue([
      createRoadmapRecord({
        id: 'active-roadmap',
        nodes: [
          {
            id: 'group-1',
            nodeType: NodeTypeValue.GROUP,
            estimatedHours: null,
            userNodeProgress: [
              { startedAt: new Date('2026-05-19T00:00:00Z'), status: NodeStatusValue.COMPLETED },
            ],
          },
          {
            id: 'required-1',
            nodeType: NodeTypeValue.REQUIRED,
            estimatedHours: 2,
            userNodeProgress: [
              { startedAt: new Date('2026-05-19T00:00:00Z'), status: NodeStatusValue.COMPLETED },
            ],
          },
          {
            id: 'required-2',
            nodeType: NodeTypeValue.REQUIRED,
            estimatedHours: 4,
            userNodeProgress: [
              {
                startedAt: new Date('2026-05-19T00:00:00Z'),
                status: NodeStatusValue.IN_PROGRESS,
              },
            ],
          },
          {
            id: 'optional-1',
            nodeType: NodeTypeValue.OPTIONAL,
            estimatedHours: 3,
            userNodeProgress: [
              { startedAt: new Date('2026-05-19T00:00:00Z'), status: NodeStatusValue.COMPLETED },
            ],
          },
        ],
      }),
      createRoadmapRecord({
        id: 'not-started-roadmap',
        title: 'Not started roadmap',
      }),
    ]);

    const result = await service.getDashboard(MOCK_USER_ID);

    expect(result.roadmaps).toHaveLength(2);
    expect(result.roadmaps[0]).toEqual(
      expectObjectContaining({
        completionPct: 75,
        deadlineDate: null,
        estimatedWeeks: 6,
        goalName: 'Backend Engineer',
        isTemplate: false,
        roleCategory: 'WEB_DEVELOPMENT',
        roadmapId: 'active-roadmap',
        startedAt: '2026-05-19T00:00:00.000Z',
        streakDays: 2,
        skillReadinessPct: 50,
        title: 'Backend roadmap',
        nodesTotal: 4,
        nodesCompleted: 3,
        timelineWarning: null,
      }),
    );
    expect(result.roadmaps[1]).toEqual(
      expectObjectContaining({
        roadmapId: 'not-started-roadmap',
        startedAt: null,
        title: 'Not started roadmap',
      }),
    );
    expect(result.streakDays).toBe(2);
  });

  it('should summarize skills, categories, and roadmap statuses', async () => {
    const completedRoadmap = createRoadmapRecord({
      id: 'completed-roadmap',
      roleCategory: 'WEB_DEVELOPMENT' as RoleCategory,
      nodes: [
        {
          id: 'completed-group',
          nodeType: NodeTypeValue.GROUP,
          estimatedHours: null,
          userNodeProgress: [
            { startedAt: new Date('2026-05-01T00:00:00Z'), status: NodeStatusValue.COMPLETED },
          ],
        },
        {
          id: 'completed-required',
          nodeType: NodeTypeValue.REQUIRED,
          estimatedHours: 2,
          userNodeProgress: [
            { startedAt: new Date('2026-05-01T00:00:00Z'), status: NodeStatusValue.COMPLETED },
          ],
        },
        {
          id: 'completed-optional',
          nodeType: NodeTypeValue.OPTIONAL,
          estimatedHours: 2,
          userNodeProgress: [
            { startedAt: new Date('2026-05-01T00:00:00Z'), status: NodeStatusValue.COMPLETED },
          ],
        },
      ],
    });
    const behindRoadmap = createRoadmapRecord({
      id: 'behind-roadmap',
      generatedAt: new Date('2026-05-01T00:00:00Z'),
      hoursPerDay: 4,
      roleCategory: 'DATABASES' as RoleCategory,
      nodes: [
        {
          id: 'behind-required',
          nodeType: NodeTypeValue.REQUIRED,
          estimatedHours: 2,
          userNodeProgress: [
            {
              startedAt: new Date('2026-05-10T00:00:00Z'),
              status: NodeStatusValue.IN_PROGRESS,
            },
          ],
        },
      ],
    });
    const notStartedRoadmap = createRoadmapRecord({
      id: 'not-started-roadmap',
      roleCategory: 'DATABASES' as RoleCategory,
      nodes: [
        {
          id: 'not-started-required',
          nodeType: NodeTypeValue.REQUIRED,
          estimatedHours: 3,
          userNodeProgress: [{ startedAt: null, status: NodeStatusValue.LOCKED }],
        },
        {
          id: 'not-started-milestone',
          nodeType: NodeTypeValue.MILESTONE,
          estimatedHours: 6,
          userNodeProgress: [{ startedAt: null, status: NodeStatusValue.LOCKED }],
        },
      ],
    });

    prisma.user.findUnique.mockResolvedValue(createUserRecord());
    prisma.roadmap.findMany.mockResolvedValue([completedRoadmap, behindRoadmap, notStartedRoadmap]);

    const result = await service.getDashboard(MOCK_USER_ID);

    expect(result.summary).toEqual({
      totalRoadmaps: 3,
      activeRoadmaps: 2,
      completedRoadmaps: 1,
      totalSkills: 4,
      completedSkills: 2,
      inProgressSkills: 1,
      lockedSkills: 1,
      currentStreak: 0,
    });
    expect(result.skillCategories).toEqual([
      {
        category: 'DATABASES',
        label: 'Databases',
        totalSkills: 2,
      },
      {
        category: 'WEB_DEVELOPMENT',
        label: 'Web Development',
        totalSkills: 2,
      },
    ]);
    expect(result.roadmapStatus).toEqual({
      behindPace: 1,
      onTrack: 0,
      completed: 1,
      notStarted: 1,
    });
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
