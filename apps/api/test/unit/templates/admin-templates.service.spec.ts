import type { TestingModule } from '@nestjs/testing';

import { HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NodeType, RoleCategory } from '@repo/db/prisma/client';

import { ErrorCode } from '@/common/constants/error-codes';
import {
  RoadmapNodeNotFoundException,
  RoadmapNotFoundException,
  SkillNotFoundException,
  TemplateNodeInvalidReferenceException,
  TemplateNodeInvalidShapeException,
  TemplateNodeInvalidValueException,
} from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { AdminTemplatesService } from '@/modules/templates/admin-templates.service';

type AsyncMock<TResult = unknown, TArgs extends unknown[] = unknown[]> = jest.Mock<
  Promise<TResult>,
  TArgs
>;

interface TemplateRoadmapRecord {
  deadlineDate: Date | null;
  description: string | null;
  estimatedWeeks: number | null;
  generatedAt: Date;
  goalName: string | null;
  hoursPerDay: DecimalMock | number | null;
  id: string;
  isTemplate: boolean;
  roleCategory: RoleCategory;
  title: string;
  updatedAt: Date;
  userId: string | null;
}

interface TemplateNodeRecord {
  createdAt: Date;
  description: string | null;
  estimatedHours: DecimalMock | number | null;
  id: string;
  name: string;
  nodeType: NodeType;
  parentId: string | null;
  posX: DecimalMock | number;
  posY: DecimalMock | number;
  roadmapId: string;
  skillId: string | null;
}

interface TxMock {
  roadmapNode: {
    deleteMany: AsyncMock<{ count: number }>;
  };
}

interface AdminTemplatesPrismaMock {
  $transaction: AsyncMock<unknown, [unknown]>;
  roadmap: {
    create: AsyncMock<TemplateRoadmapRecord>;
    deleteMany: AsyncMock<{ count: number }>;
    findFirst: AsyncMock<TemplateRoadmapRecord | null>;
    update: AsyncMock<TemplateRoadmapRecord>;
  };
  roadmapNode: {
    create: AsyncMock<TemplateNodeRecord>;
    deleteMany: AsyncMock<{ count: number }>;
    findFirst: AsyncMock<{ id: string; nodeType?: NodeType } | TemplateNodeRecord | null>;
    update: AsyncMock<TemplateNodeRecord>;
  };
  skill: {
    findUnique: AsyncMock<{ id: string; roleCategory: RoleCategory | null } | null>;
  };
}

interface DecimalMock {
  toNumber: () => number;
  toString: () => string;
}

const templateId = 'template-1';
const nodeId = 'node-1';
const parentId = 'group-1';
const skillId = 'skill-1';
const otherTemplateId = 'template-2';

const createDecimal = (value: number): DecimalMock => ({
  toNumber: () => value,
  toString: () => value.toString(),
});

const expectAnyObject = (): object => expect.any(Object) as object;

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

const makeTemplate = (overrides: Partial<TemplateRoadmapRecord> = {}): TemplateRoadmapRecord => ({
  deadlineDate: null,
  description: 'A backend roadmap template',
  estimatedWeeks: 12,
  generatedAt: new Date('2026-01-01T00:00:00.000Z'),
  goalName: null,
  hoursPerDay: null,
  id: templateId,
  isTemplate: true,
  roleCategory: RoleCategory.WEB_DEVELOPMENT,
  title: 'Backend Template',
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  userId: null,
  ...overrides,
});

const makeNode = (overrides: Partial<TemplateNodeRecord> = {}): TemplateNodeRecord => ({
  createdAt: new Date('2026-01-03T00:00:00.000Z'),
  description: null,
  estimatedHours: createDecimal(4),
  id: nodeId,
  name: 'HTTP APIs',
  nodeType: NodeType.REQUIRED,
  parentId,
  posX: createDecimal(100),
  posY: createDecimal(200),
  roadmapId: templateId,
  skillId,
  ...overrides,
});

const makeTxMock = (): TxMock => ({
  roadmapNode: {
    deleteMany: jest.fn<Promise<{ count: number }>, unknown[]>().mockResolvedValue({ count: 1 }),
  },
});

const createPrismaMock = (txMock: TxMock): AdminTemplatesPrismaMock => ({
  $transaction: jest.fn<Promise<unknown>, [unknown]>().mockImplementation(async (input) => {
    if (Array.isArray(input)) {
      return Promise.all(input as Promise<unknown>[]);
    }

    const callback = input as (tx: TxMock) => unknown;
    return callback(txMock);
  }),
  roadmap: {
    create: jest.fn<Promise<TemplateRoadmapRecord>, unknown[]>(),
    deleteMany: jest.fn<Promise<{ count: number }>, unknown[]>(),
    findFirst: jest.fn<Promise<TemplateRoadmapRecord | null>, unknown[]>(),
    update: jest.fn<Promise<TemplateRoadmapRecord>, unknown[]>(),
  },
  roadmapNode: {
    create: jest.fn<Promise<TemplateNodeRecord>, unknown[]>(),
    deleteMany: jest.fn<Promise<{ count: number }>, unknown[]>(),
    findFirst: jest.fn<
      Promise<{ id: string; nodeType?: NodeType } | TemplateNodeRecord | null>,
      unknown[]
    >(),
    update: jest.fn<Promise<TemplateNodeRecord>, unknown[]>(),
  },
  skill: {
    findUnique: jest.fn<
      Promise<{ id: string; roleCategory: RoleCategory | null } | null>,
      unknown[]
    >(),
  },
});

describe('AdminTemplatesService', () => {
  let service: AdminTemplatesService;
  let prisma: AdminTemplatesPrismaMock;
  let txMock: TxMock;

  beforeEach(async () => {
    txMock = makeTxMock();
    const prismaMock = createPrismaMock(txMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminTemplatesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<AdminTemplatesService>(AdminTemplatesService);
    prisma = prismaMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('templates', () => {
    it('creates templates with personal roadmap fields forced to null', async () => {
      const template = makeTemplate({ estimatedWeeks: null });

      prisma.roadmap.create.mockResolvedValue(template);

      const result = await service.createTemplate({
        description: template.description!,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
        title: template.title,
      });

      expect(prisma.roadmap.create).toHaveBeenCalledWith({
        data: {
          deadlineDate: null,
          description: template.description,
          estimatedWeeks: null,
          goalName: null,
          hoursPerDay: null,
          isTemplate: true,
          roleCategory: RoleCategory.WEB_DEVELOPMENT,
          title: template.title,
          userId: null,
        },
        select: expectAnyObject(),
      });
      expect(result.id).toBe(templateId);
      expect(result.isTemplate).toBe(true);
      expect(result.userId).toBeNull();
    });

    it('updates template metadata without changing role category', async () => {
      const template = makeTemplate();
      const updated = makeTemplate({ estimatedWeeks: null, title: 'Updated Template' });

      prisma.roadmap.findFirst.mockResolvedValue(template);
      prisma.roadmap.update.mockResolvedValue(updated);

      const result = await service.updateTemplate(templateId, {
        estimatedWeeks: null,
        title: 'Updated Template',
      });

      expect(prisma.roadmap.findFirst).toHaveBeenCalledWith({
        select: expectAnyObject(),
        where: { id: templateId, isTemplate: true },
      });
      expect(prisma.roadmap.update).toHaveBeenCalledWith({
        data: {
          estimatedWeeks: null,
          title: 'Updated Template',
        },
        select: expectAnyObject(),
        where: { id: templateId },
      });
      expect(result.title).toBe('Updated Template');
      expect(result.estimatedWeeks).toBeNull();
    });

    it('deletes only template roadmaps', async () => {
      prisma.roadmap.deleteMany.mockResolvedValue({ count: 1 });

      await expect(service.deleteTemplate(templateId)).resolves.toBeUndefined();

      expect(prisma.roadmap.deleteMany).toHaveBeenCalledWith({
        where: { id: templateId, isTemplate: true },
      });
    });

    it('throws RoadmapNotFoundException when the ID is missing or not a template', async () => {
      prisma.roadmap.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.deleteTemplate(templateId)).rejects.toThrow(RoadmapNotFoundException);
    });
  });

  describe('nodes', () => {
    beforeEach(() => {
      prisma.roadmap.findFirst.mockResolvedValue(makeTemplate());
    });

    it('creates a group node without parent, skill, description, or hours', async () => {
      const group = makeNode({
        estimatedHours: null,
        id: parentId,
        name: 'Foundations',
        nodeType: NodeType.GROUP,
        parentId: null,
        skillId: null,
      });

      prisma.roadmapNode.create.mockResolvedValue(group);

      const result = await service.createNode(templateId, {
        name: 'Foundations',
        nodeType: NodeType.GROUP,
        posX: 0,
        posY: 0,
      });

      expect(prisma.roadmapNode.create).toHaveBeenCalledWith({
        data: {
          description: null,
          estimatedHours: null,
          name: 'Foundations',
          nodeType: NodeType.GROUP,
          parentId: null,
          posX: 0,
          posY: 0,
          roadmapId: templateId,
          skillId: null,
        },
        select: expectAnyObject(),
      });
      expect(prisma.skill.findUnique).not.toHaveBeenCalled();
      expect(result.nodeType).toBe(NodeType.GROUP);
    });

    it('creates a leaf node when parent is a same-template group and skill exists', async () => {
      const node = makeNode();

      prisma.roadmapNode.findFirst.mockResolvedValue({ id: parentId });
      prisma.skill.findUnique.mockResolvedValue({
        id: skillId,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      });
      prisma.roadmapNode.create.mockResolvedValue(node);

      const result = await service.createNode(templateId, {
        estimatedHours: 4,
        name: 'HTTP APIs',
        nodeType: NodeType.REQUIRED,
        parentId,
        posX: 100,
        posY: 200,
        skillId,
      });

      expect(prisma.roadmapNode.findFirst).toHaveBeenCalledWith({
        select: { id: true },
        where: {
          id: parentId,
          nodeType: NodeType.GROUP,
          roadmap: { isTemplate: true },
          roadmapId: templateId,
        },
      });
      expect(prisma.skill.findUnique).toHaveBeenCalledWith({
        select: { id: true, roleCategory: true },
        where: { id: skillId },
      });
      expect(result.id).toBe(nodeId);
    });

    it('updates nodes after merging existing state with the dto', async () => {
      const existing = makeNode();
      const updated = makeNode({ posX: 120 });

      prisma.roadmapNode.findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ id: parentId });
      prisma.skill.findUnique.mockResolvedValue({
        id: skillId,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      });
      prisma.roadmapNode.update.mockResolvedValue(updated);

      const result = await service.updateNode(templateId, nodeId, { posX: 120 });

      expect(prisma.roadmapNode.update).toHaveBeenCalledWith({
        data: { posX: 120 },
        select: expectAnyObject(),
        where: { id: nodeId },
      });
      expect(result.posX).toBe(120);
    });

    it('throws RoadmapNodeNotFoundException when updating a missing node', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(null);

      await expect(service.updateNode(templateId, nodeId, { posX: 100 })).rejects.toThrow(
        RoadmapNodeNotFoundException,
      );
    });

    it('rejects invalid group and milestone node shapes', async () => {
      const groupPromise = service.createNode(templateId, {
        name: 'Bad Group',
        nodeType: NodeType.GROUP,
        posX: 0,
        posY: 0,
        skillId,
      });

      await expect(groupPromise).rejects.toThrow(TemplateNodeInvalidShapeException);
      await expectExceptionCode(groupPromise, ErrorCode.TEMPLATE_NODE_INVALID_SHAPE);

      await expect(
        service.createNode(templateId, {
          estimatedHours: 1,
          name: 'Bad Milestone',
          nodeType: NodeType.MILESTONE,
          posX: 0,
          posY: 0,
        }),
      ).rejects.toThrow(TemplateNodeInvalidShapeException);
    });

    it('rejects leaf nodes without a parent or skill', async () => {
      const missingParentPromise = service.createNode(templateId, {
        name: 'No Parent',
        nodeType: NodeType.REQUIRED,
        posX: 0,
        posY: 0,
        skillId,
      });

      await expect(missingParentPromise).rejects.toThrow(TemplateNodeInvalidReferenceException);
      await expectExceptionCode(missingParentPromise, ErrorCode.TEMPLATE_NODE_INVALID_REFERENCE);

      await expect(
        service.createNode(templateId, {
          name: 'No Skill',
          nodeType: NodeType.OPTIONAL,
          parentId,
          posX: 0,
          posY: 0,
        }),
      ).rejects.toThrow(TemplateNodeInvalidReferenceException);
    });

    it('rejects invalid, cross-template, and non-group parents', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(null);

      await expect(
        service.createNode(templateId, {
          name: 'Bad Parent',
          nodeType: NodeType.REQUIRED,
          parentId: otherTemplateId,
          posX: 0,
          posY: 0,
          skillId,
        }),
      ).rejects.toThrow(TemplateNodeInvalidReferenceException);
    });

    it('throws SkillNotFoundException for missing skills', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({ id: parentId });
      prisma.skill.findUnique.mockResolvedValue(null);

      await expect(
        service.createNode(templateId, {
          name: 'Unknown Skill',
          nodeType: NodeType.REQUIRED,
          parentId,
          posX: 0,
          posY: 0,
          skillId,
        }),
      ).rejects.toThrow(SkillNotFoundException);
    });

    it('rejects cross-role skills', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({ id: parentId });
      prisma.skill.findUnique.mockResolvedValue({
        id: skillId,
        roleCategory: RoleCategory.DEVOPS,
      });

      await expect(
        service.createNode(templateId, {
          name: 'Wrong Skill',
          nodeType: NodeType.REQUIRED,
          parentId,
          posX: 0,
          posY: 0,
          skillId,
        }),
      ).rejects.toThrow(TemplateNodeInvalidReferenceException);
    });

    it('rejects bad layout values at the service layer', async () => {
      const promise = service.createNode(templateId, {
        name: 'Bad Layout',
        nodeType: NodeType.GROUP,
        posX: Number.NaN,
        posY: 0,
      });

      await expect(promise).rejects.toThrow(TemplateNodeInvalidValueException);
      await expectExceptionCode(promise, ErrorCode.TEMPLATE_NODE_INVALID_VALUE);
    });

    it('validates merged update state so node type changes cannot leave stale leaf fields', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(makeNode());

      await expect(
        service.updateNode(templateId, nodeId, { nodeType: NodeType.GROUP }),
      ).rejects.toThrow(TemplateNodeInvalidShapeException);
    });

    it('deletes group child leaves before deleting the group node', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: parentId,
        nodeType: NodeType.GROUP,
      });

      await service.deleteNode(templateId, parentId);

      expect(txMock.roadmapNode.deleteMany).toHaveBeenNthCalledWith(1, {
        where: {
          nodeType: { in: [NodeType.REQUIRED, NodeType.OPTIONAL] },
          parentId,
          roadmapId: templateId,
        },
      });
      expect(txMock.roadmapNode.deleteMany).toHaveBeenNthCalledWith(2, {
        where: {
          id: parentId,
          nodeType: NodeType.GROUP,
          roadmapId: templateId,
        },
      });
    });

    it('deletes non-group nodes without deleting siblings', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.MILESTONE,
      });
      prisma.roadmapNode.deleteMany.mockResolvedValue({ count: 1 });

      await service.deleteNode(templateId, nodeId);

      expect(prisma.roadmapNode.deleteMany).toHaveBeenCalledWith({
        where: { id: nodeId, roadmapId: templateId },
      });
      expect(txMock.roadmapNode.deleteMany).not.toHaveBeenCalled();
    });
  });
});
