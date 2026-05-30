import type { TestingModule } from '@nestjs/testing';

import { Test } from '@nestjs/testing';
import { NodeType, RoleCategory } from '@repo/db/prisma/client';

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
    jest.clearAllMocks();
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
        },
      });
      expect(prisma.roadmap.count.mock.calls[0]?.[0]).toEqual({
        where: {
          isTemplate: true,
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
            roleCategory: RoleCategory.DATA_ANALYSIS,
          },
        }),
      );
      expect(prisma.roadmap.count.mock.calls[0]?.[0]).toEqual({
        where: {
          isTemplate: true,
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
