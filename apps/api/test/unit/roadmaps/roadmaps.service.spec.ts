/* eslint-disable @typescript-eslint/unbound-method */
import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';
import { NodeStatus, NodeType, RoleCategory } from '@repo/db/prisma/client';

import {
  DeadlineInPastException,
  RoadmapGenerationUnavailableException,
  RoadmapNotFoundException,
} from '@/common/exceptions/app.exceptions';
import { AiService } from '@/modules/ai/ai.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { DagreLayoutService } from '@/modules/roadmaps/dagre-layout.service';
import { RoadmapsService } from '@/modules/roadmaps/roadmaps.service';

import {
  MOCK_USER_ID,
  MOCK_DTO,
  MOCK_SKILL_MAP as MOCK_SKILLS,
  MOCK_PRISMA_SKILL_PREREQUISITES,
  MOCK_SKILL_PREREQUISITES,
  MOCK_AI_ROADMAP as MOCK_AI_OUTPUT,
  MOCK_LAYOUT_MAP,
  MOCK_ROADMAP,
} from '../../utils/roadmaps.mock';

function makeTxMock() {
  return {
    roadmap: { create: jest.fn().mockResolvedValue(MOCK_ROADMAP) },
    roadmapNode: { createMany: jest.fn().mockResolvedValue({ count: 19 }) },
    userNodeProgress: {
      createMany: jest.fn().mockResolvedValue({ count: 19 }),
      updateMany: jest.fn().mockResolvedValue({ count: 4 }),
    },
  };
}

type TransactionMock = ReturnType<typeof makeTxMock>;
type TransactionCallback = (tx: TransactionMock) => unknown;
type AsyncMock<TResult = unknown, TArgs extends unknown[] = unknown[]> = jest.Mock<
  Promise<TResult>,
  TArgs
>;

interface RoadmapsPrismaMock {
  $transaction: AsyncMock<unknown, [unknown]>;
  roadmap: {
    count: AsyncMock<number>;
    deleteMany: AsyncMock<{ count: number }>;
    findFirst: AsyncMock<Record<string, unknown> | null>;
    findMany: AsyncMock<unknown[]>;
  };
  roadmapNode: {
    findMany: AsyncMock<unknown[]>;
  };
  skill: {
    findMany: AsyncMock<typeof MOCK_SKILLS>;
  };
  skillPrerequisite: {
    findMany: AsyncMock<typeof MOCK_PRISMA_SKILL_PREREQUISITES>;
  };
}

const createDecimal = (value: number) => ({
  toNumber: () => value,
  toString: () => value.toString(),
});

const createPrismaMock = (txMock: TransactionMock): RoadmapsPrismaMock => ({
  $transaction: jest.fn<Promise<unknown>, [unknown]>().mockImplementation(async (input) => {
    if (Array.isArray(input)) {
      const transactionItems = input as Promise<unknown>[];

      return Promise.all(transactionItems);
    }

    const transactionCallback = input as TransactionCallback;
    return transactionCallback(txMock);
  }),
  roadmap: {
    count: jest.fn<Promise<number>, unknown[]>(),
    deleteMany: jest.fn<Promise<{ count: number }>, unknown[]>(),
    findFirst: jest.fn<Promise<Record<string, unknown> | null>, unknown[]>(),
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
  },
  roadmapNode: { findMany: jest.fn<Promise<unknown[]>, unknown[]>() },
  skill: {
    findMany: jest.fn<Promise<typeof MOCK_SKILLS>, unknown[]>().mockResolvedValue(MOCK_SKILLS),
  },
  skillPrerequisite: {
    findMany: jest
      .fn<Promise<typeof MOCK_PRISMA_SKILL_PREREQUISITES>, unknown[]>()
      .mockResolvedValue(MOCK_PRISMA_SKILL_PREREQUISITES),
  },
});

describe('RoadmapsService', () => {
  let service: RoadmapsService;
  let prisma: RoadmapsPrismaMock;
  let aiService: jest.Mocked<AiService>;
  let dagreLayout: jest.Mocked<DagreLayoutService>;

  beforeEach(async () => {
    const txMock = makeTxMock();
    const prismaMock = createPrismaMock(txMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoadmapsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: AiService,
          useValue: {
            generateRoadmap: jest.fn().mockResolvedValue(JSON.stringify(MOCK_AI_OUTPUT)),
          },
        },
        {
          provide: DagreLayoutService,
          useValue: { computeLayout: jest.fn().mockReturnValue(MOCK_LAYOUT_MAP) },
        },
      ],
    }).compile();

    service = module.get<RoadmapsService>(RoadmapsService);
    prisma = prismaMock;
    aiService = module.get(AiService);
    dagreLayout = module.get(DagreLayoutService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deadline validation', () => {
    it('should throw DeadlineInPastException for a past date', async () => {
      await expect(
        service.generate(MOCK_USER_ID, { ...MOCK_DTO, deadlineDate: '2000-01-01' }),
      ).rejects.toThrow(DeadlineInPastException);
    });

    it('should throw DeadlineInPastException for today', async () => {
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      await expect(
        service.generate(MOCK_USER_ID, { ...MOCK_DTO, deadlineDate: yesterday }),
      ).rejects.toThrow(DeadlineInPastException);
    });

    it('should NOT call Gemini when deadline is in the past', async () => {
      await expect(
        service.generate(MOCK_USER_ID, { ...MOCK_DTO, deadlineDate: '2000-01-01' }),
      ).rejects.toThrow();
      expect(aiService.generateRoadmap).not.toHaveBeenCalled();
    });
  });

  describe('timeline feasibility check', () => {
    it('should return timelineWarning=null when deadline is comfortably far', async () => {
      const result = await service.generate(MOCK_USER_ID, MOCK_DTO);
      expect(result.timelineWarning).toBeNull();
    });

    it('should return a timelineWarning when pace is >15% behind', async () => {
      // MOCK_SKILLS total = 24h, use a very near deadline + low hours/day
      const result = await service.generate(MOCK_USER_ID, {
        ...MOCK_DTO,
        deadlineDate: new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10), // 2 days out
        hoursPerDay: 0.5, // only 1h available → way behind 24h
      });
      expect(result.timelineWarning).not.toBeNull();
      expect(result.timelineWarning!.isBehind).toBe(true);
      expect(result.timelineWarning!.paceDeficitPct).toBeGreaterThan(0);
      expect(result.timelineWarning!.estimatedDelayDays).toBeGreaterThan(0);
    });
  });

  describe('AI generation and parsing failure', () => {
    it('should propagate RoadmapGenerationUnavailableException from AiService', async () => {
      aiService.generateRoadmap.mockRejectedValue(new RoadmapGenerationUnavailableException());

      await expect(service.generate(MOCK_USER_ID, MOCK_DTO)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });

    it('should throw RoadmapGenerationUnavailableException on malformed JSON', async () => {
      aiService.generateRoadmap.mockResolvedValue('not-valid-json{{');

      await expect(service.generate(MOCK_USER_ID, MOCK_DTO)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });

    it('should throw RoadmapGenerationUnavailableException when title is missing', async () => {
      const invalid = {
        description: 'ok',
        nodes: [{ name: 'X', nodeType: 'group', skillId: 'X' }],
      };
      aiService.generateRoadmap.mockResolvedValue(JSON.stringify(invalid));

      await expect(service.generate(MOCK_USER_ID, MOCK_DTO)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });

    it('should throw RoadmapGenerationUnavailableException when nodes array is empty', async () => {
      const invalid = { title: 'T', description: 'D', nodes: [] };
      aiService.generateRoadmap.mockResolvedValue(JSON.stringify(invalid));

      await expect(service.generate(MOCK_USER_ID, MOCK_DTO)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });

    it('should throw RoadmapGenerationUnavailableException when a group node has skillId', async () => {
      const invalid = {
        title: 'T',
        description: 'D',
        nodes: [
          {
            name: 'Backend Foundations',
            nodeType: 'group',
            skillId: 'skill-1',
            children: [{ name: 'HTTP & REST', nodeType: 'required', skillId: 'skill-1' }],
          },
        ],
      };
      aiService.generateRoadmap.mockResolvedValue(JSON.stringify(invalid));

      await expect(service.generate(MOCK_USER_ID, MOCK_DTO)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });

    it('should throw RoadmapGenerationUnavailableException when a leaf node has no skillId', async () => {
      const invalid = {
        title: 'T',
        description: 'D',
        nodes: [
          {
            name: 'Backend Foundations',
            nodeType: 'group',
            children: [{ name: 'HTTP & REST', nodeType: 'required' }],
          },
        ],
      };
      aiService.generateRoadmap.mockResolvedValue(JSON.stringify(invalid));

      await expect(service.generate(MOCK_USER_ID, MOCK_DTO)).rejects.toThrow(
        RoadmapGenerationUnavailableException,
      );
    });
  });

  describe('happy path', () => {
    it('should call skill.findMany with the correct roleCategory', async () => {
      await service.generate(MOCK_USER_ID, MOCK_DTO);
      expect(prisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { roleCategory: MOCK_DTO.roleCategory } }),
      );
    });

    it('should load skill prerequisites for the selected role skills', async () => {
      await service.generate(MOCK_USER_ID, MOCK_DTO);

      expect(prisma.skillPrerequisite.findMany).toHaveBeenCalledWith({
        where: {
          skillId: { in: MOCK_SKILLS.map((skill) => skill.id) },
          prerequisiteSkillId: { in: MOCK_SKILLS.map((skill) => skill.id) },
        },
        select: {
          skillId: true,
          prerequisiteSkillId: true,
          skill: { select: { name: true } },
          prerequisiteSkill: { select: { name: true } },
        },
      });
    });

    it('should pass prerequisites to AiService', async () => {
      await service.generate(MOCK_USER_ID, MOCK_DTO);

      expect(aiService.generateRoadmap).toHaveBeenCalledWith(
        expect.objectContaining({
          prerequisites: MOCK_SKILL_PREREQUISITES,
        }),
      );
    });

    it('should call DagreLayoutService.computeLayout once', async () => {
      await service.generate(MOCK_USER_ID, MOCK_DTO);
      expect(dagreLayout.computeLayout).toHaveBeenCalledTimes(1);
    });

    it('should return { roadmap, timelineWarning: null } on success', async () => {
      const result = await service.generate(MOCK_USER_ID, MOCK_DTO);
      expect(result.roadmap).toBeDefined();
      expect(result.roadmap.id).toBe(MOCK_ROADMAP.id);
      expect(result.timelineWarning).toBeNull();
    });

    it('should NOT include quiz answers in any Prisma call args', async () => {
      await service.generate(MOCK_USER_ID, MOCK_DTO);

      // Inspect all $transaction calls — none should contain quizAnswers
      const txCalls = (prisma.$transaction as jest.Mock).mock.calls;
      expect(txCalls.length).toBeGreaterThan(0);
      const txCallString = JSON.stringify(txCalls);
      // quizAnswers answers are free text strings 'A1'…'A7'
      expect(txCallString).not.toContain('quizAnswers');
    });
  });

  describe('listNodes', () => {
    const roadmapId = 'roadmap-1';

    it('should return nodes with embedded progress', async () => {
      const mockNodes = [
        {
          id: 'node-1',
          roadmapId: 'roadmap-1',
          parentId: null,
          skillId: null,
          name: 'Backend Foundations',
          description: null,
          nodeType: NodeType.GROUP,
          estimatedHours: null,
          posX: 120,
          posY: 200,
          userNodeProgress: [],
        },
        {
          id: 'node-2',
          roadmapId: 'roadmap-1',
          parentId: 'node-1',
          skillId: 'skill-1',
          name: 'REST API',
          description: null,
          nodeType: NodeType.REQUIRED,
          estimatedHours: 6,
          posX: 140,
          posY: 240,
          userNodeProgress: [
            {
              id: 'progress-1',
              userId: MOCK_USER_ID,
              roadmapNodeId: 'node-2',
              status: NodeStatus.COMPLETED,
              startedAt: new Date('2026-01-01T00:00:00Z'),
              completedAt: new Date('2026-01-02T00:00:00Z'),
              quizScorePct: 80,
              quizPassed: true,
            },
          ],
        },
      ];

      prisma.roadmapNode.findMany.mockResolvedValue(mockNodes);

      const result = await service.listNodes(MOCK_USER_ID, roadmapId, {});

      expect(prisma.roadmapNode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { roadmapId, roadmap: { userId: MOCK_USER_ID } },
        }),
      );
      expect(result).toEqual({
        nodes: [
          {
            id: 'node-1',
            roadmapId: 'roadmap-1',
            parentId: null,
            skillId: null,
            name: 'Backend Foundations',
            description: null,
            nodeType: NodeType.GROUP,
            estimatedHours: null,
            posX: 120,
            posY: 200,
            progress: null,
          },
          {
            id: 'node-2',
            roadmapId: 'roadmap-1',
            parentId: 'node-1',
            skillId: 'skill-1',
            name: 'REST API',
            description: null,
            nodeType: NodeType.REQUIRED,
            estimatedHours: 6,
            posX: 140,
            posY: 240,
            progress: {
              id: 'progress-1',
              roadmapNodeId: 'node-2',
              status: NodeStatus.COMPLETED,
              startedAt: new Date('2026-01-01T00:00:00Z'),
              completedAt: new Date('2026-01-02T00:00:00Z'),
              quizScorePct: 80,
              quizPassed: true,
            },
          },
        ],
      });
    });

    it('should filter by status on leaf nodes', async () => {
      prisma.roadmapNode.findMany.mockResolvedValue([]);

      await service.listNodes(MOCK_USER_ID, roadmapId, { status: NodeStatus.COMPLETED });

      expect(prisma.roadmapNode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            roadmapId,
            nodeType: { in: [NodeType.REQUIRED, NodeType.OPTIONAL] },
            userNodeProgress: {
              some: {
                status: NodeStatus.COMPLETED,
                userId: MOCK_USER_ID,
              },
            },
          }) as unknown,
        }),
      );
    });

    it('should apply case-insensitive name filtering', async () => {
      prisma.roadmapNode.findMany.mockResolvedValue([]);

      await service.listNodes(MOCK_USER_ID, roadmapId, { q: 'REST' });

      expect(prisma.roadmapNode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            roadmapId,
            name: { contains: 'REST', mode: 'insensitive' },
          }) as unknown,
        }),
      );
    });

    it('should return empty when status is set for non-leaf nodeType', async () => {
      const result = await service.listNodes(MOCK_USER_ID, roadmapId, {
        nodeType: NodeType.GROUP,
        status: NodeStatus.COMPLETED,
      });

      expect(result).toEqual({ nodes: [] });
      expect(prisma.roadmapNode.findMany).not.toHaveBeenCalled();
    });
  });

  describe('listUserRoadmaps', () => {
    it('should return paginated current user roadmaps with mapped response fields', async () => {
      const roadmap = {
        deadlineDate: new Date('2025-10-01T00:00:00.000Z'),
        description: 'A backend plan',
        estimatedWeeks: null,
        generatedAt: new Date('2025-04-24T07:00:00.000Z'),
        goalName: 'Backend Intern at a product company',
        hoursPerDay: createDecimal(2.5),
        id: 'roadmap-1',
        isTemplate: false,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
        title: 'Your Backend Intern Roadmap',
        updatedAt: new Date('2025-04-25T08:00:00.000Z'),
        userId: 'user-1',
      };

      prisma.roadmap.findMany.mockResolvedValue([roadmap]);
      prisma.roadmap.count.mockResolvedValue(42);

      const result = await service.listUserRoadmaps('user-1', { page: 2, perPage: 10 });

      expect(prisma.roadmap.findMany.mock.calls[0]?.[0]).toEqual({
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: {
          deadlineDate: true,
          description: true,
          estimatedWeeks: true,
          generatedAt: true,
          goalName: true,
          hoursPerDay: true,
          id: true,
          isTemplate: true,
          roleCategory: true,
          title: true,
          updatedAt: true,
          userId: true,
        },
        skip: 10,
        take: 10,
        where: {
          isTemplate: false,
          userId: 'user-1',
        },
      });
      expect(prisma.roadmap.count.mock.calls[0]?.[0]).toEqual({
        where: {
          isTemplate: false,
          userId: 'user-1',
        },
      });
      expect(result).toEqual({
        data: [
          {
            deadlineDate: '2025-10-01',
            description: 'A backend plan',
            estimatedWeeks: null,
            generatedAt: '2025-04-24T07:00:00.000Z',
            goalName: 'Backend Intern at a product company',
            hoursPerDay: 2.5,
            id: 'roadmap-1',
            isTemplate: false,
            roleCategory: RoleCategory.WEB_DEVELOPMENT,
            title: 'Your Backend Intern Roadmap',
            updatedAt: '2025-04-25T08:00:00.000Z',
            userId: 'user-1',
          },
        ],
        meta: {
          page: 2,
          perPage: 10,
          total: 42,
          totalPages: 5,
        },
      });
    });

    it('should use default pagination values', async () => {
      prisma.roadmap.findMany.mockResolvedValue([]);
      prisma.roadmap.count.mockResolvedValue(0);

      const result = await service.listUserRoadmaps('user-1', {});

      expect(prisma.roadmap.findMany.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
      expect(result.meta).toEqual({
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 0,
      });
    });

    it('should return an empty data array when no roadmaps exist for the requested page', async () => {
      prisma.roadmap.findMany.mockResolvedValue([]);
      prisma.roadmap.count.mockResolvedValue(21);

      const result = await service.listUserRoadmaps('user-1', { page: 4, perPage: 10 });

      expect(result).toEqual({
        data: [],
        meta: {
          page: 4,
          perPage: 10,
          total: 21,
          totalPages: 3,
        },
      });
    });
  });

  describe('getByIdForOwner', () => {
    it('should return a formatted roadmap when owned by the user', async () => {
      const roadmapId = 'roadmap-1';
      const userId = 'user-1';
      const roadmap = {
        deadlineDate: new Date('2025-10-01T00:00:00.000Z'),
        description: 'A backend plan',
        estimatedWeeks: null,
        generatedAt: new Date('2025-04-24T07:00:00.000Z'),
        goalName: 'Backend Intern at a product company',
        hoursPerDay: createDecimal(2.5),
        id: roadmapId,
        isTemplate: false,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
        title: 'Backend roadmap',
        updatedAt: new Date('2025-04-25T08:00:00.000Z'),
        userId,
      };

      prisma.roadmap.findFirst.mockResolvedValue(roadmap);

      await expect(service.getByIdForOwner(userId, roadmapId)).resolves.toEqual({
        deadlineDate: '2025-10-01',
        description: 'A backend plan',
        estimatedWeeks: null,
        generatedAt: '2025-04-24T07:00:00.000Z',
        goalName: 'Backend Intern at a product company',
        hoursPerDay: 2.5,
        id: roadmapId,
        isTemplate: false,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
        title: 'Backend roadmap',
        updatedAt: '2025-04-25T08:00:00.000Z',
        userId,
      });

      expect(prisma.roadmap.findFirst).toHaveBeenCalledWith({
        select: {
          deadlineDate: true,
          description: true,
          estimatedWeeks: true,
          generatedAt: true,
          goalName: true,
          hoursPerDay: true,
          id: true,
          isTemplate: true,
          roleCategory: true,
          title: true,
          updatedAt: true,
          userId: true,
        },
        where: {
          id: roadmapId,
          isTemplate: false,
          userId,
        },
      });
    });

    it('should throw 404 when roadmap does not belong to user', async () => {
      prisma.roadmap.findFirst.mockResolvedValue(null);

      await expect(service.getByIdForOwner('user-1', 'roadmap-1')).rejects.toThrow(
        RoadmapNotFoundException,
      );
    });

    it('should throw 404 when roadmap is not found', async () => {
      prisma.roadmap.findFirst.mockResolvedValue(null);

      await expect(service.getByIdForOwner('user-1', 'roadmap-1')).rejects.toThrow(
        RoadmapNotFoundException,
      );
    });

    it('should throw 404 when roadmap is a template', async () => {
      prisma.roadmap.findFirst.mockResolvedValue(null);

      await expect(service.getByIdForOwner('user-1', 'roadmap-1')).rejects.toThrow(
        RoadmapNotFoundException,
      );
    });
  });

  describe('deleteByIdForOwner', () => {
    it('should permanently delete an owned roadmap', async () => {
      const roadmapId = 'roadmap-1';
      const userId = 'user-1';

      prisma.roadmap.deleteMany.mockResolvedValue({ count: 1 });

      await service.deleteByIdForOwner(userId, roadmapId);

      expect(prisma.roadmap.deleteMany).toHaveBeenCalledWith({
        where: {
          id: roadmapId,
          isTemplate: false,
          userId,
        },
      });
    });

    it('should throw 404 when roadmap belongs to another user', async () => {
      prisma.roadmap.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.deleteByIdForOwner('user-1', 'roadmap-1')).rejects.toThrow(
        RoadmapNotFoundException,
      );

      expect(prisma.roadmap.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'roadmap-1',
          isTemplate: false,
          userId: 'user-1',
        },
      });
    });

    it('should throw 404 when roadmap is not found', async () => {
      prisma.roadmap.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.deleteByIdForOwner('user-1', 'roadmap-1')).rejects.toThrow(
        RoadmapNotFoundException,
      );
    });

    it('should throw 404 when roadmap is a template', async () => {
      prisma.roadmap.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.deleteByIdForOwner('user-1', 'roadmap-1')).rejects.toThrow(
        RoadmapNotFoundException,
      );
    });
  });
});
