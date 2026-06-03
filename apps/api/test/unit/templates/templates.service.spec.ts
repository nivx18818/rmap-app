import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';
import { NodeStatus, NodeType, RoleCategory } from '@repo/db/prisma/client';

import { RoadmapNotFoundException } from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { TemplatesService } from '@/modules/templates/templates.service';

type AsyncMock<TResult = unknown, TArgs extends unknown[] = unknown[]> = jest.Mock<
  Promise<TResult>,
  TArgs
>;

interface TemplatesPrismaMock {
  $transaction: AsyncMock<unknown, [unknown]>;
  roadmap: {
    count: AsyncMock<number>;
    findFirst: AsyncMock<Record<string, unknown> | null>;
    findMany: AsyncMock<unknown[]>;
    groupBy: AsyncMock<Array<{ roleCategory: RoleCategory; _count: { _all: number } }>>;
  };
  roadmapNode: {
    findMany: AsyncMock<unknown[]>;
  };
}

const createDecimal = (value: number) => ({
  toNumber: () => value,
  toString: () => value.toString(),
});

const expectObjectContaining = <T extends object>(value: T): T =>
  expect.objectContaining(value) as T;

const createPrismaMock = (): TemplatesPrismaMock => ({
  $transaction: jest.fn<Promise<unknown>, [unknown]>().mockImplementation(async (input) => {
    if (Array.isArray(input)) {
      return Promise.all(input as Promise<unknown>[]);
    }

    return input;
  }),
  roadmap: {
    count: jest.fn<Promise<number>, unknown[]>(),
    findFirst: jest.fn<Promise<Record<string, unknown> | null>, unknown[]>(),
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
    groupBy: jest.fn<
      Promise<Array<{ roleCategory: RoleCategory; _count: { _all: number } }>>,
      unknown[]
    >(),
  },
  roadmapNode: {
    findMany: jest.fn<Promise<unknown[]>, unknown[]>(),
  },
});

describe('TemplatesService', () => {
  let service: TemplatesService;
  let prisma: TemplatesPrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('listCategories', () => {
    it('should return all role categories with template counts', async () => {
      prisma.roadmap.groupBy.mockResolvedValue([
        { roleCategory: RoleCategory.WEB_DEVELOPMENT, _count: { _all: 24 } },
        { roleCategory: RoleCategory.AI_AND_MACHINE_LEARNING, _count: { _all: 18 } },
      ]);

      const result = await service.listCategories();

      expect(prisma.roadmap.groupBy).toHaveBeenCalledWith({
        by: ['roleCategory'],
        where: { isTemplate: true },
        _count: { _all: true },
      });
      expect(result.total).toBe(Object.values(RoleCategory).length);
      expect(result.categories).toContainEqual({
        category: RoleCategory.WEB_DEVELOPMENT,
        label: 'Web Development',
        templatesCount: 24,
      });
      expect(result.categories).toContainEqual({
        category: RoleCategory.AI_AND_MACHINE_LEARNING,
        label: 'Ai And Machine Learning',
        templatesCount: 18,
      });
      expect(result.categories).toContainEqual({
        category: RoleCategory.DEVOPS,
        label: 'Devops',
        templatesCount: 0,
      });
    });
  });

  describe('listTemplates', () => {
    it('should return paginated templates with mapped response fields', async () => {
      const template = {
        deadlineDate: null,
        description: 'A public backend learning plan',
        estimatedWeeks: 16,
        generatedAt: new Date('2026-01-01T00:00:00.000Z'),
        goalName: null,
        hoursPerDay: null,
        id: 'template-1',
        isTemplate: true,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
        title: 'Backend Template',
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        userId: null,
      };

      prisma.roadmap.findMany.mockResolvedValue([template]);
      prisma.roadmap.count.mockResolvedValue(21);

      const result = await service.listTemplates({ page: 2, perPage: 10 });

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
          isTemplate: true,
          nodes: { some: {} },
        },
      });
      expect(prisma.roadmap.count.mock.calls[0]?.[0]).toEqual({
        where: {
          isTemplate: true,
          nodes: { some: {} },
        },
      });
      expect(result).toEqual({
        data: [
          {
            deadlineDate: null,
            description: 'A public backend learning plan',
            estimatedWeeks: 16,
            generatedAt: '2026-01-01T00:00:00.000Z',
            goalName: null,
            hoursPerDay: null,
            id: 'template-1',
            isTemplate: true,
            roleCategory: RoleCategory.WEB_DEVELOPMENT,
            startedAt: null,
            title: 'Backend Template',
            updatedAt: '2026-01-02T00:00:00.000Z',
            userId: null,
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

    it('should apply roleCategory and default pagination', async () => {
      prisma.roadmap.findMany.mockResolvedValue([]);
      prisma.roadmap.count.mockResolvedValue(0);

      const result = await service.listTemplates({
        roleCategory: RoleCategory.DATA_ANALYSIS,
      });

      expect(prisma.roadmap.findMany.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({
          skip: 0,
          take: 20,
          where: {
            isTemplate: true,
            nodes: { some: {} },
            roleCategory: RoleCategory.DATA_ANALYSIS,
          },
        }),
      );
      expect(prisma.roadmap.count.mock.calls[0]?.[0]).toEqual({
        where: {
          isTemplate: true,
          nodes: { some: {} },
          roleCategory: RoleCategory.DATA_ANALYSIS,
        },
      });
      expect(result.meta).toEqual({
        page: 1,
        perPage: 20,
        total: 0,
        totalPages: 0,
      });
    });
  });

  describe('listTrendings', () => {
    it('should return 5 random template roadmaps with random trend text', async () => {
      const randomSpy = jest
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0.99)
        .mockReturnValueOnce(0.99)
        .mockReturnValueOnce(0.99)
        .mockReturnValueOnce(0.99)
        .mockReturnValueOnce(0.99)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.39)
        .mockReturnValueOnce(0.998)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.25)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.5);
      const templates = Array.from({ length: 6 }, (_, index) => ({
        id: `template-${index + 1}`,
        title: `Template ${index + 1}`,
        estimatedWeeks: index === 0 ? 12 : 3,
        roleCategory: index % 2 === 0 ? RoleCategory.WEB_DEVELOPMENT : RoleCategory.DEVOPS,
        nodes: Array.from({ length: index + 1 }, () => ({ nodeType: NodeType.REQUIRED })),
      }));

      prisma.roadmap.findMany.mockResolvedValue(templates);

      const result = await service.listTrendings();

      expect(prisma.roadmap.findMany).toHaveBeenCalledWith({
        where: { isTemplate: true },
        select: {
          estimatedWeeks: true,
          id: true,
          nodes: {
            select: { nodeType: true },
          },
          roleCategory: true,
          title: true,
        },
      });
      expect(result.total).toBe(5);
      expect(result.trendings).toEqual([
        {
          rank: 1,
          roadmapId: 'template-1',
          title: 'Template 1',
          roleCategory: RoleCategory.WEB_DEVELOPMENT,
          categoryLabel: 'Web Development',
          estimatedWeeks: 12,
          durationLabel: '3 months',
          nodesTotal: 1,
          trendText: '1 learners',
        },
        {
          rank: 2,
          roadmapId: 'template-2',
          title: 'Template 2',
          roleCategory: RoleCategory.DEVOPS,
          categoryLabel: 'Devops',
          estimatedWeeks: 3,
          durationLabel: '3 weeks',
          nodesTotal: 2,
          trendText: 'Popular this month',
        },
        {
          rank: 3,
          roadmapId: 'template-3',
          title: 'Template 3',
          roleCategory: RoleCategory.WEB_DEVELOPMENT,
          categoryLabel: 'Web Development',
          estimatedWeeks: 3,
          durationLabel: '3 weeks',
          nodesTotal: 3,
          trendText: '500 learners',
        },
        {
          rank: 4,
          roadmapId: 'template-4',
          title: 'Template 4',
          roleCategory: RoleCategory.DEVOPS,
          categoryLabel: 'Devops',
          estimatedWeeks: 3,
          durationLabel: '3 weeks',
          nodesTotal: 4,
          trendText: 'Popular this week',
        },
        {
          rank: 5,
          roadmapId: 'template-5',
          title: 'Template 5',
          roleCategory: RoleCategory.WEB_DEVELOPMENT,
          categoryLabel: 'Web Development',
          estimatedWeeks: 3,
          durationLabel: '3 weeks',
          nodesTotal: 5,
          trendText: 'Trending now',
        },
      ]);
      const learnerCounts = result.trendings
        .map((item) => item.trendText.match(/^(\d+) learners$/)?.[1])
        .filter((value): value is string => value !== undefined)
        .map(Number);

      expect(learnerCounts.every((count) => count >= 1 && count <= 500)).toBe(true);
      expect(randomSpy).toHaveBeenCalled();
    });
  });

  describe('getTemplate', () => {
    it('should return a formatted template roadmap', async () => {
      const template = {
        deadlineDate: null,
        description: 'A frontend template',
        estimatedWeeks: 12,
        generatedAt: new Date('2026-01-03T00:00:00.000Z'),
        goalName: null,
        hoursPerDay: null,
        id: 'template-1',
        isTemplate: true,
        roleCategory: RoleCategory.FRAMEWORKS,
        title: 'React Template',
        updatedAt: new Date('2026-01-04T00:00:00.000Z'),
        userId: null,
      };

      prisma.roadmap.findFirst.mockResolvedValue(template);

      const result = await service.getTemplate('template-1');

      expect(prisma.roadmap.findFirst).toHaveBeenCalledWith({
        select: expectObjectContaining({
          id: true,
          isTemplate: true,
          title: true,
        }),
        where: {
          id: 'template-1',
          isTemplate: true,
        },
      });
      expect(result).toEqual({
        deadlineDate: null,
        description: 'A frontend template',
        estimatedWeeks: 12,
        generatedAt: '2026-01-03T00:00:00.000Z',
        goalName: null,
        hoursPerDay: null,
        id: 'template-1',
        isTemplate: true,
        roleCategory: RoleCategory.FRAMEWORKS,
        startedAt: null,
        title: 'React Template',
        updatedAt: '2026-01-04T00:00:00.000Z',
        userId: null,
      });
    });

    it('should throw 404 when template is not found', async () => {
      prisma.roadmap.findFirst.mockResolvedValue(null);

      await expect(service.getTemplate('template-1')).rejects.toThrow(RoadmapNotFoundException);
    });

    it('should throw 404 when the id belongs to a non-template roadmap', async () => {
      prisma.roadmap.findFirst.mockResolvedValue(null);

      await expect(service.getTemplate('roadmap-1')).rejects.toThrow(RoadmapNotFoundException);
      expect(prisma.roadmap.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'roadmap-1',
            isTemplate: true,
          },
        }),
      );
    });
  });

  describe('getRecommendations', () => {
    it('should return template recommendations from active roadmap role categories', async () => {
      const activeTemplate = {
        id: 'active-template',
        isTemplate: true,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
        nodes: [
          {
            userNodeProgress: [
              {
                startedAt: new Date('2026-05-18T00:00:00Z'),
                status: NodeStatus.IN_PROGRESS,
              },
            ],
          },
        ],
      };
      const activeAiRoadmap = {
        id: 'active-ai-roadmap',
        isTemplate: false,
        roleCategory: RoleCategory.AI_AND_MACHINE_LEARNING,
        nodes: [
          {
            userNodeProgress: [
              {
                startedAt: new Date('2026-05-19T00:00:00Z'),
                status: NodeStatus.IN_PROGRESS,
              },
            ],
          },
        ],
      };
      const completedRoadmap = {
        id: 'completed-roadmap',
        isTemplate: false,
        roleCategory: RoleCategory.DATABASES,
        nodes: [
          {
            userNodeProgress: [
              {
                startedAt: new Date('2026-05-10T00:00:00Z'),
                status: NodeStatus.COMPLETED,
              },
            ],
          },
        ],
      };
      const recommendations = [
        {
          id: 'ai-template',
          title: 'AI Engineering Path',
          description: 'Learn AI engineering',
          goalName: 'AI Engineer',
          estimatedWeeks: 16,
          roleCategory: RoleCategory.AI_AND_MACHINE_LEARNING,
          nodes: [
            { nodeType: NodeType.GROUP },
            { nodeType: NodeType.REQUIRED },
            { nodeType: NodeType.OPTIONAL },
          ],
        },
        {
          id: 'web-template',
          title: 'Frontend Pro',
          description: 'A frontend roadmap',
          goalName: null,
          estimatedWeeks: 3,
          roleCategory: RoleCategory.WEB_DEVELOPMENT,
          nodes: [{ nodeType: NodeType.REQUIRED }, { nodeType: NodeType.REQUIRED }],
        },
      ];

      prisma.roadmap.findMany
        .mockResolvedValueOnce([activeTemplate, activeAiRoadmap, completedRoadmap])
        .mockResolvedValueOnce(recommendations);

      const result = await service.getRecommendations('user-1');

      expect(prisma.roadmap.findMany).toHaveBeenNthCalledWith(
        1,
        expectObjectContaining({
          where: {
            OR: [
              {
                isTemplate: false,
                nodes: {
                  some: {
                    userNodeProgress: {
                      some: {
                        startedAt: { not: null },
                        userId: 'user-1',
                      },
                    },
                  },
                },
                userId: 'user-1',
              },
              {
                isTemplate: true,
                nodes: {
                  some: {
                    userNodeProgress: {
                      some: {
                        startedAt: { not: null },
                        userId: 'user-1',
                      },
                    },
                  },
                },
              },
            ],
          },
        }),
      );
      expect(prisma.roadmap.findMany).toHaveBeenNthCalledWith(
        2,
        expectObjectContaining({
          where: expectObjectContaining({
            id: { notIn: ['active-template'] },
            isTemplate: true,
            roleCategory: {
              in: [RoleCategory.AI_AND_MACHINE_LEARNING, RoleCategory.WEB_DEVELOPMENT],
            },
          }),
        }),
      );
      expect(result).toEqual({
        roleCategories: [
          {
            category: RoleCategory.AI_AND_MACHINE_LEARNING,
            label: 'Ai And Machine Learning',
          },
          { category: RoleCategory.WEB_DEVELOPMENT, label: 'Web Development' },
        ],
        total: 2,
        relevantRoadmaps: [
          {
            roadmapId: 'ai-template',
            title: 'AI Engineering Path',
            description: 'Learn AI engineering',
            goalName: 'AI Engineer',
            roleCategory: RoleCategory.AI_AND_MACHINE_LEARNING,
            categoryLabel: 'Ai And Machine Learning',
            estimatedWeeks: 16,
            durationLabel: '4 months',
            nodesTotal: 3,
            requiredNodesTotal: 1,
          },
          {
            roadmapId: 'web-template',
            title: 'Frontend Pro',
            description: 'A frontend roadmap',
            goalName: null,
            roleCategory: RoleCategory.WEB_DEVELOPMENT,
            categoryLabel: 'Web Development',
            estimatedWeeks: 3,
            durationLabel: '3 weeks',
            nodesTotal: 2,
            requiredNodesTotal: 2,
          },
        ],
      });
    });

    it('should return empty recommendations when the user has no active roadmap categories', async () => {
      prisma.roadmap.findMany.mockResolvedValueOnce([]);

      const result = await service.getRecommendations('user-1');

      expect(prisma.roadmap.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        roleCategories: [],
        total: 0,
        relevantRoadmaps: [],
      });
    });
  });

  describe('listTemplateNodes', () => {
    it('should return flat template nodes without user progress', async () => {
      prisma.roadmap.findFirst.mockResolvedValue({ id: 'template-1' });
      prisma.roadmapNode.findMany.mockResolvedValue([
        {
          description: null,
          estimatedHours: null,
          id: 'group-1',
          name: 'Foundations',
          nodeType: NodeType.GROUP,
          parentId: null,
          posX: createDecimal(100),
          posY: createDecimal(200),
          roadmapId: 'template-1',
          skillId: null,
        },
        {
          description: null,
          estimatedHours: createDecimal(6),
          id: 'node-1',
          name: 'HTTP',
          nodeType: NodeType.REQUIRED,
          parentId: 'group-1',
          posX: createDecimal(140),
          posY: createDecimal(240),
          roadmapId: 'template-1',
          skillId: 'skill-1',
        },
      ]);

      const result = await service.listTemplateNodes('template-1', {});

      expect(prisma.roadmap.findFirst).toHaveBeenCalledWith({
        select: { id: true },
        where: {
          id: 'template-1',
          isTemplate: true,
        },
      });
      expect(prisma.roadmapNode.findMany).toHaveBeenCalledWith({
        orderBy: [{ posY: 'asc' }, { posX: 'asc' }, { id: 'asc' }],
        select: {
          description: true,
          estimatedHours: true,
          id: true,
          name: true,
          nodeType: true,
          parentId: true,
          posX: true,
          posY: true,
          roadmapId: true,
          skillId: true,
        },
        where: {
          roadmapId: 'template-1',
        },
      });
      expect(result).toEqual({
        nodes: [
          {
            description: null,
            estimatedHours: null,
            id: 'group-1',
            name: 'Foundations',
            nodeType: NodeType.GROUP,
            parentId: null,
            posX: 100,
            posY: 200,
            roadmapId: 'template-1',
            skillId: null,
          },
          {
            description: null,
            estimatedHours: 6,
            id: 'node-1',
            name: 'HTTP',
            nodeType: NodeType.REQUIRED,
            parentId: 'group-1',
            posX: 140,
            posY: 240,
            roadmapId: 'template-1',
            skillId: 'skill-1',
          },
        ],
      });
      expect(JSON.stringify(result)).not.toContain('progress');
    });

    it('should apply nodeType filtering', async () => {
      prisma.roadmap.findFirst.mockResolvedValue({ id: 'template-1' });
      prisma.roadmapNode.findMany.mockResolvedValue([]);

      await service.listTemplateNodes('template-1', { nodeType: NodeType.MILESTONE });

      expect(prisma.roadmapNode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            nodeType: NodeType.MILESTONE,
            roadmapId: 'template-1',
          },
        }),
      );
    });

    it('should throw 404 when template is not found', async () => {
      prisma.roadmap.findFirst.mockResolvedValue(null);

      await expect(service.listTemplateNodes('template-1', {})).rejects.toThrow(
        RoadmapNotFoundException,
      );
      expect(prisma.roadmapNode.findMany).not.toHaveBeenCalled();
    });

    it('should throw 404 when the id belongs to a non-template roadmap', async () => {
      prisma.roadmap.findFirst.mockResolvedValue(null);

      await expect(service.listTemplateNodes('roadmap-1', {})).rejects.toThrow(
        RoadmapNotFoundException,
      );
      expect(prisma.roadmap.findFirst).toHaveBeenCalledWith({
        select: { id: true },
        where: {
          id: 'roadmap-1',
          isTemplate: true,
        },
      });
    });
  });
});
