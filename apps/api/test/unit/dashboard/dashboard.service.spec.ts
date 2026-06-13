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
  description?: string | null;
  id: string;
  name?: string;
  nodeType: NodeType;
  parentId?: string | null;
  skillId?: string | null;
  estimatedHours: number | null;
  posY?: number;
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
  avatarUrl: string;
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
  dailyActivity: DailyActivityRecord[];
  roadmaps: DashboardRoadmapRecord[];
}

interface DashboardPrismaMock {
  $transaction: AsyncMock<unknown[], [unknown[]]>;
  roadmap: {
    count: AsyncMock<number>;
    findMany: AsyncMock<unknown[]>;
  };
  skill: {
    count: AsyncMock<number>;
    findMany: AsyncMock<unknown[]>;
  };
  user: {
    findUnique: AsyncMock<DashboardUserRecord | null>;
  };
}

const MOCK_USER_ID = 'user-1';
const SYSTEM_NOW = new Date('2026-05-20T10:00:00Z');

const createPrismaMock = (): DashboardPrismaMock => ({
  $transaction: jest
    .fn<Promise<unknown[]>, [unknown[]]>()
    .mockImplementation(async (items) => Promise.all(items)),
  roadmap: {
    count: jest.fn<Promise<number>, unknown[]>().mockResolvedValue(0),
    findMany: jest.fn<Promise<unknown[]>, unknown[]>().mockResolvedValue([]),
  },
  skill: {
    count: jest.fn<Promise<number>, unknown[]>().mockResolvedValue(0),
    findMany: jest.fn<Promise<unknown[]>, unknown[]>().mockResolvedValue([]),
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
  avatarUrl: 'https://api.dicebear.com/10.x/adventurer/svg?seed=Test%20User',
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
        select: expectObjectContaining({
          nodes: {
            select: {
              id: true,
              nodeType: true,
              skillId: true,
              estimatedHours: true,
              userNodeProgress: {
                where: { userId: MOCK_USER_ID },
                select: { status: true, startedAt: true },
              },
            },
          },
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
          skillId: 'web-skill',
          estimatedHours: 2,
          userNodeProgress: [
            { startedAt: new Date('2026-05-01T00:00:00Z'), status: NodeStatusValue.COMPLETED },
          ],
        },
        {
          id: 'completed-optional',
          nodeType: NodeTypeValue.OPTIONAL,
          skillId: 'web-skill',
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
          skillId: 'database-skill',
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
          skillId: 'database-skill',
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
        completedSkills: 0,
        label: 'Databases',
        totalSkills: 1,
      },
      {
        category: 'WEB_DEVELOPMENT',
        completedSkills: 1,
        label: 'Web Development',
        totalSkills: 1,
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

  it('should return mobile home payload for active learning roadmaps', async () => {
    prisma.user.findUnique.mockResolvedValue(
      createUserRecord({
        dailyActivity: [
          { activityDate: new Date('2026-05-20T00:00:00Z'), nodesCompleted: 1 },
          { activityDate: new Date('2026-05-19T00:00:00Z'), nodesCompleted: 2 },
        ],
      }),
    );
    prisma.roadmap.findMany.mockResolvedValue([
      createRoadmapRecord({
        id: 'active-roadmap',
        generatedAt: new Date('2026-05-01T00:00:00Z'),
        hoursPerDay: 2,
        title: 'React roadmap',
        nodes: [
          {
            id: 'group-1',
            name: 'React Fundamentals',
            nodeType: NodeTypeValue.GROUP,
            estimatedHours: null,
            parentId: null,
            posY: 1,
            userNodeProgress: [
              { startedAt: new Date('2026-05-10T00:00:00Z'), status: NodeStatusValue.COMPLETED },
            ],
          },
          {
            id: 'group-2',
            name: 'State Management',
            nodeType: NodeTypeValue.GROUP,
            estimatedHours: null,
            parentId: null,
            posY: 2,
            userNodeProgress: [
              {
                startedAt: new Date('2026-05-19T00:00:00Z'),
                status: NodeStatusValue.IN_PROGRESS,
              },
            ],
          },
          {
            id: 'hooks',
            name: 'Hooks and State Management',
            description: 'Learn hooks and state patterns',
            nodeType: NodeTypeValue.REQUIRED,
            estimatedHours: null,
            parentId: 'group-2',
            posY: 3,
            userNodeProgress: [
              {
                startedAt: new Date('2026-05-19T00:00:00Z'),
                status: NodeStatusValue.IN_PROGRESS,
              },
            ],
          },
          {
            id: 'required-done',
            name: 'Components',
            nodeType: NodeTypeValue.REQUIRED,
            estimatedHours: 2,
            parentId: 'group-1',
            posY: 4,
            userNodeProgress: [
              { startedAt: new Date('2026-05-10T00:00:00Z'), status: NodeStatusValue.COMPLETED },
            ],
          },
          {
            id: 'milestone-1',
            name: 'React Project',
            nodeType: NodeTypeValue.MILESTONE,
            estimatedHours: 4,
            parentId: null,
            posY: 5,
            userNodeProgress: [{ startedAt: null, status: NodeStatusValue.LOCKED }],
          },
          {
            id: 'group-3',
            name: 'React Query',
            nodeType: NodeTypeValue.GROUP,
            estimatedHours: null,
            parentId: null,
            posY: 6,
            userNodeProgress: [{ startedAt: null, status: NodeStatusValue.LOCKED }],
          },
        ],
      }),
      createRoadmapRecord({
        id: 'not-started-roadmap',
        nodes: [
          {
            id: 'not-started-required',
            name: 'Locked skill',
            nodeType: NodeTypeValue.REQUIRED,
            estimatedHours: 3,
            userNodeProgress: [{ startedAt: null, status: NodeStatusValue.LOCKED }],
          },
        ],
      }),
    ]);

    const result = await service.getHome(MOCK_USER_ID);

    expect(prisma.roadmap.findMany).toHaveBeenCalledWith(
      expectObjectContaining({
        select: expectObjectContaining({
          nodes: {
            select: expectObjectContaining({
              description: true,
              name: true,
              parentId: true,
              posY: true,
            }),
          },
        }),
      }),
    );
    expect(result.activeRoadmaps).toHaveLength(1);
    expect(result.activeRoadmaps[0]).toEqual(
      expectObjectContaining({
        roadmapId: 'active-roadmap',
        title: 'React roadmap',
        startedAt: '2026-05-10T00:00:00.000Z',
        currentGroup: { id: 'group-2', name: 'State Management' },
        planNode: {
          id: 'hooks',
          name: 'Hooks and State Management',
          description: 'Learn hooks and state patterns',
          nodeType: 'REQUIRED',
          estimatedHours: 3,
        },
        chapter: {
          current: 2,
          total: 4,
          label: 'Chapter 2/4',
        },
        progress: {
          requiredNodesCompleted: 1,
          requiredNodesTotal: 2,
          requiredCompletionPct: 50,
        },
        nextUnlock: { id: 'group-3', name: 'React Query' },
      }),
    );
    expect(result.activeRoadmaps[0]?.paceWarning).toEqual(
      expectObjectContaining({
        actionLabel: 'Adjust plan',
        isBehind: true,
        message: 'Finish 1 skill node today to back the track.',
        title: 'You are 94.7% behind your target pace.',
      }),
    );
    expect(result.metrics).toEqual({
      roadmapCompletionPct: 33.3,
      streakDays: 2,
      readinessPct: 50,
    });
  });

  it('should search template roadmaps, user AI roadmaps, and skills with separate pagination', async () => {
    prisma.roadmap.findMany.mockResolvedValue([
      {
        id: 'template-roadmap',
        title: 'React Fundamentals',
        description: 'Learn React from scratch',
        goalName: 'Frontend Developer',
        isTemplate: true,
        roleCategory: 'WEB_DEVELOPMENT',
        estimatedWeeks: 12,
      },
      {
        id: 'ai-roadmap',
        title: 'My React Plan',
        description: null,
        goalName: null,
        isTemplate: false,
        roleCategory: 'FRAMEWORKS',
        estimatedWeeks: 3,
      },
    ]);
    prisma.roadmap.count.mockResolvedValue(7);
    prisma.skill.findMany.mockResolvedValue([
      {
        id: 'skill-1',
        name: 'React Hooks',
        description: 'Hooks and state',
        roleCategory: 'FRAMEWORKS',
        defaultEstimatedHours: 4,
      },
    ]);
    prisma.skill.count.mockResolvedValue(11);

    const result = await service.search(MOCK_USER_ID, {
      query: ' react ',
      roadmapPage: 2,
      skillPage: 2,
    });

    expect(prisma.roadmap.findMany).toHaveBeenCalledWith({
      orderBy: [{ isTemplate: 'desc' }, { updatedAt: 'desc' }, { id: 'asc' }],
      select: {
        description: true,
        estimatedWeeks: true,
        goalName: true,
        id: true,
        isTemplate: true,
        roleCategory: true,
        title: true,
      },
      skip: 5,
      take: 5,
      where: {
        AND: [
          {
            OR: [
              { isTemplate: true },
              {
                isTemplate: false,
                userId: MOCK_USER_ID,
              },
            ],
          },
          {
            nodes: {
              some: {},
            },
          },
          {
            OR: [
              { title: { contains: 'react', mode: 'insensitive' } },
              { goalName: { contains: 'react', mode: 'insensitive' } },
              { description: { contains: 'react', mode: 'insensitive' } },
            ],
          },
        ],
      },
    });
    expect(prisma.roadmap.count).toHaveBeenCalledWith({
      where: expectObjectContaining({
        AND: expect.any(Array) as object[],
      }),
    });
    expect(prisma.skill.findMany).toHaveBeenCalledWith({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: {
        defaultEstimatedHours: true,
        description: true,
        id: true,
        name: true,
        roleCategory: true,
      },
      skip: 10,
      take: 10,
      where: {
        name: {
          contains: 'react',
          mode: 'insensitive',
        },
      },
    });
    expect(result).toEqual({
      query: 'react',
      roadmaps: {
        data: [
          {
            roadmapId: 'template-roadmap',
            title: 'React Fundamentals',
            description: 'Learn React from scratch',
            goalName: 'Frontend Developer',
            isTemplate: true,
            roadmapType: 'template',
            roleCategory: 'WEB_DEVELOPMENT',
            categoryLabel: 'Web Development',
            estimatedWeeks: 12,
            durationLabel: '3 months',
          },
          {
            roadmapId: 'ai-roadmap',
            title: 'My React Plan',
            description: null,
            goalName: null,
            isTemplate: false,
            roadmapType: 'ai',
            roleCategory: 'FRAMEWORKS',
            categoryLabel: 'Frameworks',
            estimatedWeeks: 3,
            durationLabel: '3 weeks',
          },
        ],
        meta: {
          page: 2,
          perPage: 5,
          total: 7,
          totalPages: 2,
        },
      },
      skills: {
        data: [
          {
            skillId: 'skill-1',
            name: 'React Hooks',
            description: 'Hooks and state',
            roleCategory: 'FRAMEWORKS',
            categoryLabel: 'Frameworks',
            defaultEstimatedHours: 4,
          },
        ],
        meta: {
          page: 2,
          perPage: 10,
          total: 11,
          totalPages: 2,
        },
      },
      meta: {
        totalResults: 18,
        roadmapPageSize: 5,
        skillPageSize: 10,
      },
    });
  });

  it('should search template roadmaps only (excluding user AI roadmaps) and skills when userId is undefined', async () => {
    prisma.roadmap.findMany.mockResolvedValue([
      {
        id: 'template-roadmap',
        title: 'React Fundamentals',
        description: 'Learn React from scratch',
        goalName: 'Frontend Developer',
        isTemplate: true,
        roleCategory: 'WEB_DEVELOPMENT',
        estimatedWeeks: 12,
      },
    ]);
    prisma.roadmap.count.mockResolvedValue(5);
    prisma.skill.findMany.mockResolvedValue([
      {
        id: 'skill-1',
        name: 'React Hooks',
        description: 'Hooks and state',
        roleCategory: 'FRAMEWORKS',
        defaultEstimatedHours: 4,
      },
    ]);
    prisma.skill.count.mockResolvedValue(8);

    const result = await service.search(undefined, {
      query: ' react ',
      roadmapPage: 2,
      skillPage: 2,
    });

    expect(prisma.roadmap.findMany).toHaveBeenCalledWith({
      orderBy: [{ isTemplate: 'desc' }, { updatedAt: 'desc' }, { id: 'asc' }],
      select: {
        description: true,
        estimatedWeeks: true,
        goalName: true,
        id: true,
        isTemplate: true,
        roleCategory: true,
        title: true,
      },
      skip: 5,
      take: 5,
      where: {
        AND: [
          { isTemplate: true },
          {
            nodes: {
              some: {},
            },
          },
          {
            OR: [
              { title: { contains: 'react', mode: 'insensitive' } },
              { goalName: { contains: 'react', mode: 'insensitive' } },
              { description: { contains: 'react', mode: 'insensitive' } },
            ],
          },
        ],
      },
    });
    expect(prisma.roadmap.count).toHaveBeenCalledWith({
      where: expectObjectContaining({
        AND: expect.any(Array) as object[],
      }),
    });
    expect(prisma.skill.findMany).toHaveBeenCalledWith({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      select: {
        defaultEstimatedHours: true,
        description: true,
        id: true,
        name: true,
        roleCategory: true,
      },
      skip: 10,
      take: 10,
      where: {
        name: {
          contains: 'react',
          mode: 'insensitive',
        },
      },
    });
    expect(result.roadmaps.data).toHaveLength(1);
    expect(result.roadmaps.data[0]?.roadmapId).toBe('template-roadmap');
    expect(result.skills.data).toHaveLength(1);
    expect(result.meta.totalResults).toBe(13);
  });

  it('should return empty search payload without querying roadmaps or skills when query is blank', async () => {
    const result = await service.search(MOCK_USER_ID, {
      query: '   ',
      roadmapPage: 3,
      skillPage: 4,
    });

    expect(prisma.roadmap.findMany).not.toHaveBeenCalled();
    expect(prisma.roadmap.count).not.toHaveBeenCalled();
    expect(prisma.skill.findMany).not.toHaveBeenCalled();
    expect(prisma.skill.count).not.toHaveBeenCalled();
    expect(result).toEqual({
      query: '',
      roadmaps: {
        data: [],
        meta: {
          page: 3,
          perPage: 5,
          total: 0,
          totalPages: 0,
        },
      },
      skills: {
        data: [],
        meta: {
          page: 4,
          perPage: 10,
          total: 0,
          totalPages: 0,
        },
      },
      meta: {
        totalResults: 0,
        roadmapPageSize: 5,
        skillPageSize: 10,
      },
    });
  });

  it('should throw UserNotFoundException when user is missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getDashboard(MOCK_USER_ID)).rejects.toThrow(UserNotFoundException);
  });
});
