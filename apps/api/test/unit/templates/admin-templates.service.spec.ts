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
  TemplateReorderInvalidException,
  ValidationException,
} from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { DagreLayoutService } from '@/modules/roadmaps/services/dagre-layout.service';
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
    count: AsyncMock<number>;
    deleteMany: AsyncMock<{ count: number }>;
    findMany: AsyncMock<Array<{ id: string; parentId: string | null }>>;
    updateMany: AsyncMock<{ count: number }>;
  };
}

interface AdminTemplatesPrismaMock {
  $transaction: AsyncMock<unknown, [unknown]>;
  roadmap: {
    count: AsyncMock<number>;
    create: AsyncMock<TemplateRoadmapRecord>;
    deleteMany: AsyncMock<{ count: number }>;
    findMany: AsyncMock<TemplateRoadmapRecord[]>;
    findFirst: AsyncMock<TemplateRoadmapRecord | null>;
    update: AsyncMock<TemplateRoadmapRecord>;
  };
  roadmapNode: {
    count: AsyncMock<number>;
    create: AsyncMock<TemplateNodeRecord>;
    deleteMany: AsyncMock<{ count: number }>;
    findMany: AsyncMock<TemplateNodeRecord[]>;
    findFirst: AsyncMock<{ id: string; nodeType?: NodeType } | TemplateNodeRecord | null>;
    update: AsyncMock<TemplateNodeRecord>;
    updateMany: AsyncMock<{ count: number }>;
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
    count: jest.fn<Promise<number>, unknown[]>(),
    deleteMany: jest.fn<Promise<{ count: number }>, unknown[]>().mockResolvedValue({ count: 1 }),
    findMany: jest.fn<Promise<Array<{ id: string; parentId: string | null }>>, unknown[]>(),
    updateMany: jest.fn<Promise<{ count: number }>, unknown[]>(),
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
    count: jest.fn<Promise<number>, unknown[]>(),
    create: jest.fn<Promise<TemplateRoadmapRecord>, unknown[]>(),
    deleteMany: jest.fn<Promise<{ count: number }>, unknown[]>(),
    findMany: jest.fn<Promise<TemplateRoadmapRecord[]>, unknown[]>(),
    findFirst: jest.fn<Promise<TemplateRoadmapRecord | null>, unknown[]>(),
    update: jest.fn<Promise<TemplateRoadmapRecord>, unknown[]>(),
  },
  roadmapNode: {
    count: jest.fn<Promise<number>, unknown[]>().mockResolvedValue(0),
    create: jest.fn<Promise<TemplateNodeRecord>, unknown[]>(),
    deleteMany: jest.fn<Promise<{ count: number }>, unknown[]>(),
    findMany: jest.fn<Promise<TemplateNodeRecord[]>, unknown[]>().mockResolvedValue([]),
    findFirst: jest.fn<
      Promise<{ id: string; nodeType?: NodeType } | TemplateNodeRecord | null>,
      unknown[]
    >(),
    update: jest.fn<Promise<TemplateNodeRecord>, unknown[]>(),
    updateMany: jest.fn<Promise<{ count: number }>, unknown[]>().mockResolvedValue({ count: 1 }),
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
  let dagreLayout: jest.Mocked<Pick<DagreLayoutService, 'computeLayout'>>;

  beforeEach(async () => {
    txMock = makeTxMock();
    const prismaMock = createPrismaMock(txMock);
    dagreLayout = {
      computeLayout: jest.fn(
        (nodes: Parameters<DagreLayoutService['computeLayout']>[0]) =>
          new Map(
            nodes.map((node, index) => [node.tempId, { posX: index * 100, posY: index * 50 }]),
          ),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminTemplatesService,
        {
          provide: DagreLayoutService,
          useValue: dagreLayout,
        },
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
    it('lists admin templates without requiring template nodes', async () => {
      const emptyTemplate = makeTemplate({
        id: 'empty-template',
        title: 'Empty Backend Template',
      });

      prisma.roadmap.findMany.mockResolvedValue([emptyTemplate]);
      prisma.roadmap.count.mockResolvedValue(1);

      const result = await service.listTemplates({
        page: 1,
        perPage: 10,
        q: 'Backend',
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      });

      expect(prisma.roadmap.findMany).toHaveBeenCalledWith({
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: expectAnyObject(),
        skip: 0,
        take: 10,
        where: {
          isTemplate: true,
          roleCategory: RoleCategory.WEB_DEVELOPMENT,
          title: {
            contains: 'Backend',
            mode: 'insensitive',
          },
        },
      });
      expect(prisma.roadmap.count).toHaveBeenCalledWith({
        where: {
          isTemplate: true,
          roleCategory: RoleCategory.WEB_DEVELOPMENT,
          title: {
            contains: 'Backend',
            mode: 'insensitive',
          },
        },
      });
      expect(result).toEqual({
        data: [expect.objectContaining({ id: 'empty-template', title: 'Empty Backend Template' })],
        meta: {
          page: 1,
          perPage: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

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

    it('reads a template by id', async () => {
      const template = makeTemplate();

      prisma.roadmap.findFirst.mockResolvedValue(template);

      const result = await service.getTemplate(templateId);

      expect(prisma.roadmap.findFirst).toHaveBeenCalledWith({
        select: expectAnyObject(),
        where: { id: templateId, isTemplate: true },
      });
      expect(result).toMatchObject({
        id: templateId,
        isTemplate: true,
        title: template.title,
      });
    });

    it('updates template metadata including role category', async () => {
      const template = makeTemplate();
      const updated = makeTemplate({
        estimatedWeeks: null,
        roleCategory: RoleCategory.DEVOPS,
        title: 'Updated Template',
      });

      prisma.roadmap.findFirst.mockResolvedValue(template);
      prisma.roadmap.update.mockResolvedValue(updated);

      const result = await service.updateTemplate(templateId, {
        estimatedWeeks: null,
        roleCategory: RoleCategory.DEVOPS,
        title: 'Updated Template',
      });

      expect(prisma.roadmap.findFirst).toHaveBeenCalledWith({
        select: expectAnyObject(),
        where: { id: templateId, isTemplate: true },
      });
      expect(prisma.roadmap.update).toHaveBeenCalledWith({
        data: {
          estimatedWeeks: null,
          roleCategory: RoleCategory.DEVOPS,
          title: 'Updated Template',
        },
        select: expectAnyObject(),
        where: { id: templateId },
      });
      expect(result.title).toBe('Updated Template');
      expect(result.estimatedWeeks).toBeNull();
      expect(result.roleCategory).toBe(RoleCategory.DEVOPS);
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

    it('bulk deletes templates with per-item success and failure results', async () => {
      const missingTemplateId = 'template-missing';

      prisma.roadmap.deleteMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });

      const result = await service.bulkDeleteTemplates([templateId, missingTemplateId]);

      expect(result).toEqual({
        failed: [
          {
            code: String(ErrorCode.ROADMAP_NOT_FOUND),
            id: missingTemplateId,
            message: `Roadmap not found: ${missingTemplateId}`,
          },
        ],
        succeeded: [templateId],
      });
    });

    it('bulk updates template categories with per-item success and not-found failures', async () => {
      const missingTemplateId = 'template-missing';
      const template = makeTemplate();

      prisma.roadmap.findFirst.mockResolvedValueOnce(template).mockResolvedValueOnce(null);
      prisma.roadmap.update.mockResolvedValue({
        ...template,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      });

      const result = await service.bulkUpdateCategory(
        [templateId, missingTemplateId],
        RoleCategory.WEB_DEVELOPMENT,
      );

      expect(prisma.roadmap.update).toHaveBeenCalledWith({
        data: {
          roleCategory: RoleCategory.WEB_DEVELOPMENT,
        },
        select: expectAnyObject(),
        where: { id: templateId },
      });
      expect(result).toEqual({
        failed: [
          {
            code: String(ErrorCode.ROADMAP_NOT_FOUND),
            id: missingTemplateId,
            message: `Roadmap not found: ${missingTemplateId}`,
          },
        ],
        succeeded: [templateId],
      });
    });

    it('bulk operation reports generic message for unexpected non-http errors', async () => {
      // Simulate an unexpected non-HttpException error (e.g. a database driver crash)
      // to verify the final fallback branch of formatBulkFailure.
      prisma.roadmap.deleteMany.mockRejectedValue(new Error('DB connection lost'));

      const result = await service.bulkDeleteTemplates([templateId]);

      expect(result.failed).toEqual([
        {
          id: templateId,
          message: 'Unexpected failure while processing this item.',
        },
      ]);
      expect(result.succeeded).toEqual([]);
    });

    it('bulk operation uses typed errorCode for AppException subclasses', async () => {
      // ValidationException is a concrete AppException subclass — its errorCode must be
      // resolved via the typed path, not by casting the response body.
      const appEx = new ValidationException();

      prisma.roadmap.deleteMany.mockRejectedValue(appEx);

      const result = await service.bulkDeleteTemplates([templateId]);

      expect(result.failed).toEqual([
        {
          code: String(ErrorCode.VALIDATION_ERROR),
          id: templateId,
          message: expect.stringContaining('Validation'),
        },
      ]);
      expect(result.succeeded).toEqual([]);
    });
  });

  describe('nodes', () => {
    beforeEach(() => {
      prisma.roadmap.findFirst.mockResolvedValue(makeTemplate());
    });

    it('lists nodes for a template in persisted layout order', async () => {
      const group = makeNode({
        estimatedHours: null,
        id: parentId,
        name: 'Foundations',
        nodeType: NodeType.GROUP,
        parentId: null,
        skillId: null,
      });
      const leaf = makeNode();

      prisma.roadmapNode.findMany.mockResolvedValue([group, leaf]);

      const result = await service.listNodes(templateId);

      expect(prisma.roadmapNode.findMany).toHaveBeenCalledWith({
        orderBy: [{ posY: 'asc' }, { posX: 'asc' }, { id: 'asc' }],
        select: expectAnyObject(),
        where: {
          roadmap: { isTemplate: true },
          roadmapId: templateId,
        },
      });
      expect(result.nodes).toEqual([
        expect.objectContaining({ id: parentId, nodeType: NodeType.GROUP }),
        expect.objectContaining({ id: nodeId, nodeType: NodeType.REQUIRED }),
      ]);
    });

    it('reorders root nodes after validating the complete parent scope', async () => {
      const firstNode = makeNode({
        estimatedHours: null,
        id: parentId,
        name: 'Foundations',
        nodeType: NodeType.GROUP,
        parentId: null,
        posX: 0,
        posY: 0,
        skillId: null,
      });
      const secondNode = makeNode({
        estimatedHours: null,
        id: otherTemplateId,
        name: 'Milestone 1',
        nodeType: NodeType.MILESTONE,
        parentId: null,
        posX: 1,
        posY: 1,
        skillId: null,
      });

      txMock.roadmapNode.findMany.mockResolvedValue([
        { id: secondNode.id, parentId: null },
        { id: firstNode.id, parentId: null },
      ]);
      txMock.roadmapNode.count.mockResolvedValue(2);
      txMock.roadmapNode.updateMany.mockResolvedValue({ count: 1 });
      prisma.roadmapNode.findMany.mockResolvedValue([secondNode, firstNode]);

      const result = await service.reorderNodes(templateId, null, [secondNode.id, firstNode.id]);

      expect(txMock.roadmapNode.findMany).toHaveBeenCalledWith({
        select: { id: true, parentId: true },
        where: {
          id: { in: [secondNode.id, firstNode.id] },
          roadmap: { isTemplate: true },
          roadmapId: templateId,
        },
      });
      expect(txMock.roadmapNode.count).toHaveBeenCalledWith({
        where: {
          parentId: null,
          roadmap: { isTemplate: true },
          roadmapId: templateId,
        },
      });
      expect(txMock.roadmapNode.updateMany).toHaveBeenNthCalledWith(1, {
        data: { posX: 0, posY: 0 },
        where: { id: secondNode.id, roadmapId: templateId },
      });
      expect(txMock.roadmapNode.updateMany).toHaveBeenNthCalledWith(2, {
        data: { posX: 1, posY: 1 },
        where: { id: firstNode.id, roadmapId: templateId },
      });
      expect(result.nodes).toHaveLength(2);
    });

    it('rejects reorder requests when nodes are outside the requested parent scope', async () => {
      const promise = service.reorderNodes(templateId, parentId, [nodeId]);

      txMock.roadmapNode.findMany.mockResolvedValue([{ id: nodeId, parentId: null }]);

      await expect(promise).rejects.toBeInstanceOf(TemplateReorderInvalidException);
      await expectExceptionCode(promise, ErrorCode.TEMPLATE_REORDER_INVALID);
      expect(txMock.roadmapNode.updateMany).not.toHaveBeenCalled();
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
      prisma.roadmapNode.findMany.mockResolvedValue([group]);
      prisma.roadmapNode.findFirst.mockResolvedValue(group);

      const result = await service.createNode(templateId, {
        name: 'Foundations',
        nodeType: NodeType.GROUP,
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
      expect(dagreLayout.computeLayout).toHaveBeenCalledWith([
        expect.objectContaining({
          nodeType: NodeType.GROUP,
          realId: parentId,
          tempId: parentId,
        }),
      ]);
      expect(prisma.roadmapNode.updateMany).toHaveBeenCalledWith({
        data: {
          posX: 0,
          posY: 0,
        },
        where: {
          id: parentId,
          roadmapId: templateId,
        },
      });
      expect(prisma.skill.findUnique).not.toHaveBeenCalled();
      expect(result.nodeType).toBe(NodeType.GROUP);
    });

    it('creates a leaf node when parent is a same-template section and skill exists', async () => {
      const group = makeNode({
        estimatedHours: null,
        id: parentId,
        name: 'Foundations',
        nodeType: NodeType.MILESTONE,
        parentId: null,
        skillId: null,
      });
      const node = makeNode();

      prisma.roadmapNode.findFirst
        .mockResolvedValueOnce({ id: parentId })
        .mockResolvedValueOnce(node);
      prisma.roadmapNode.findMany.mockResolvedValue([group, node]);
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
        skillId,
      });

      expect(prisma.roadmapNode.findFirst).toHaveBeenCalledWith({
        select: { id: true },
        where: {
          id: parentId,
          nodeType: { in: [NodeType.GROUP, NodeType.MILESTONE] },
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
      const updated = makeNode({ estimatedHours: 7 });
      const relaid = makeNode({ estimatedHours: 7, posX: 0, posY: 0 });

      prisma.roadmapNode.findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ id: parentId })
        .mockResolvedValueOnce(relaid);
      prisma.roadmapNode.findMany.mockResolvedValue([updated]);
      prisma.skill.findUnique.mockResolvedValue({
        id: skillId,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      });
      prisma.roadmapNode.update.mockResolvedValue(updated);

      const result = await service.updateNode(templateId, nodeId, { estimatedHours: 7 });

      expect(prisma.roadmapNode.update).toHaveBeenCalledWith({
        data: { estimatedHours: 7 },
        select: expectAnyObject(),
        where: { id: nodeId },
      });
      expect(dagreLayout.computeLayout).toHaveBeenCalledTimes(1);
      expect(result.estimatedHours).toBe(7);
      expect(result.posX).toBe(0);
    });

    it('throws RoadmapNodeNotFoundException when updating a missing node', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(null);

      await expect(
        service.updateNode(templateId, nodeId, { name: 'Missing Node' }),
      ).rejects.toThrow(RoadmapNodeNotFoundException);
    });

    it('rejects invalid group and milestone node shapes', async () => {
      const groupPromise = service.createNode(templateId, {
        name: 'Bad Group',
        nodeType: NodeType.GROUP,
        skillId,
      });

      await expect(groupPromise).rejects.toThrow(TemplateNodeInvalidShapeException);
      await expectExceptionCode(groupPromise, ErrorCode.TEMPLATE_NODE_INVALID_SHAPE);

      await expect(
        service.createNode(templateId, {
          estimatedHours: 1,
          name: 'Bad Milestone',
          nodeType: NodeType.MILESTONE,
        }),
      ).rejects.toThrow(TemplateNodeInvalidShapeException);
    });

    it('rejects leaf nodes without a parent or skill', async () => {
      const missingParentPromise = service.createNode(templateId, {
        name: 'No Parent',
        nodeType: NodeType.REQUIRED,
        skillId,
      });

      await expect(missingParentPromise).rejects.toThrow(TemplateNodeInvalidReferenceException);
      await expectExceptionCode(missingParentPromise, ErrorCode.TEMPLATE_NODE_INVALID_REFERENCE);

      await expect(
        service.createNode(templateId, {
          name: 'No Skill',
          nodeType: NodeType.OPTIONAL,
          parentId,
        }),
      ).rejects.toThrow(TemplateNodeInvalidReferenceException);
    });

    it('rejects invalid, cross-template, and non-section parents', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue(null);

      await expect(
        service.createNode(templateId, {
          name: 'Bad Parent',
          nodeType: NodeType.REQUIRED,
          parentId: otherTemplateId,
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
          skillId,
        }),
      ).rejects.toThrow(TemplateNodeInvalidReferenceException);
    });

    it('rejects bad estimated hour values at the service layer', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({ id: parentId });
      prisma.skill.findUnique.mockResolvedValue({
        id: skillId,
        roleCategory: RoleCategory.WEB_DEVELOPMENT,
      });

      const promise = service.createNode(templateId, {
        estimatedHours: Number.NaN,
        name: 'Bad Layout',
        nodeType: NodeType.REQUIRED,
        parentId,
        skillId,
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
          nodeType: { in: [NodeType.GROUP, NodeType.MILESTONE] },
          roadmapId: templateId,
        },
      });
    });

    it('deletes leaf nodes without deleting siblings', async () => {
      prisma.roadmapNode.findFirst.mockResolvedValue({
        id: nodeId,
        nodeType: NodeType.REQUIRED,
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
