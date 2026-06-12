import { HttpException, Injectable } from '@nestjs/common';
import {
  NodeType,
  type Prisma,
  type RoleCategory,
  type Roadmap,
  type RoadmapNode,
} from '@repo/db/prisma/client';

import type { RoadmapResponseDto } from '@/modules/roadmaps/dto/roadmap-response.dto';
import type { FlatNode } from '@/modules/roadmaps/types/ai-roadmap.types';

import {
  RoadmapNodeNotFoundException,
  RoadmapNotFoundException,
  SkillNotFoundException,
  TemplateNodeInvalidReferenceException,
  TemplateNodeInvalidShapeException,
  TemplateNodeInvalidValueException,
} from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { DagreLayoutService } from '@/modules/roadmaps/services/dagre-layout.service';

import type { CreateTemplateNodeDto, UpdateTemplateNodeDto } from './dto/admin-template-node.dto';
import type { ListAdminTemplatesQueryDto } from './dto/admin-template-query.dto';
import type { CreateTemplateDto, UpdateTemplateDto } from './dto/admin-template.dto';
import type { AdminBulkOperationResponse as BulkOperationResponse } from './types/admin-bulk-response.types';
import type {
  AdminTemplatesListResponse,
  TemplateNodeResponse,
  TemplateNodesListResponse,
} from './types/admin-template-response.types';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const LEAF_NODE_TYPES: NodeType[] = [NodeType.REQUIRED, NodeType.OPTIONAL];
const AXIS_NODE_TYPES: NodeType[] = [NodeType.GROUP, NodeType.MILESTONE];

const TEMPLATE_ROADMAP_SELECT = {
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
} satisfies Prisma.RoadmapSelect;

const TEMPLATE_NODE_SELECT = {
  createdAt: true,
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
} satisfies Prisma.RoadmapNodeSelect;

type SelectedTemplate = Pick<Roadmap, keyof typeof TEMPLATE_ROADMAP_SELECT>;
type SelectedTemplateNode = Pick<RoadmapNode, keyof typeof TEMPLATE_NODE_SELECT>;

type DecimalLike = {
  toNumber?: () => number;
  toString: () => string;
};

type NodeState = {
  description: null | string;
  estimatedHours: DecimalLike | null | number;
  name: string;
  nodeType: NodeType;
  parentId: null | string;
  skillId: null | string;
};

type TemplateSummary = {
  id: string;
  roleCategory: RoleCategory;
};

@Injectable()
export class AdminTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dagreLayout: DagreLayoutService,
  ) {}

  async listTemplates(query: ListAdminTemplatesQueryDto): Promise<AdminTemplatesListResponse> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;
    const where = this.buildTemplateWhere(query);

    const [templates, total] = await this.prisma.$transaction([
      this.prisma.roadmap.findMany({
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: TEMPLATE_ROADMAP_SELECT,
        skip: (page - 1) * perPage,
        take: perPage,
        where,
      }),
      this.prisma.roadmap.count({ where }),
    ]);

    return {
      data: templates.map((template) => this.formatRoadmap(template)),
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async createTemplate(dto: CreateTemplateDto): Promise<RoadmapResponseDto> {
    const roadmap = await this.prisma.roadmap.create({
      data: {
        deadlineDate: null,
        description: dto.description,
        estimatedWeeks: dto.estimatedWeeks ?? null,
        goalName: null,
        hoursPerDay: null,
        isTemplate: true,
        roleCategory: dto.roleCategory,
        title: dto.title,
        userId: null,
      },
      select: TEMPLATE_ROADMAP_SELECT,
    });

    return this.formatRoadmap(roadmap);
  }

  async bulkDeleteTemplates(templateIds: string[]): Promise<BulkOperationResponse> {
    return this.runBulkOperation(templateIds, (templateId) => this.deleteTemplate(templateId));
  }

  async bulkUpdateCategory(
    templateIds: string[],
    roleCategory: RoleCategory,
  ): Promise<BulkOperationResponse> {
    return this.runBulkOperation(templateIds, async (templateId) => {
      await this.updateTemplate(templateId, { roleCategory });
    });
  }

  async getTemplate(templateId: string): Promise<RoadmapResponseDto> {
    return this.formatRoadmap(await this.findTemplateOrThrow(templateId));
  }

  async updateTemplate(templateId: string, dto: UpdateTemplateDto): Promise<RoadmapResponseDto> {
    await this.findTemplateOrThrow(templateId);

    const template = await this.prisma.roadmap.update({
      data: {
        ...(this.hasOwn(dto, 'description') ? { description: dto.description } : {}),
        ...(this.hasOwn(dto, 'estimatedWeeks') ? { estimatedWeeks: dto.estimatedWeeks } : {}),
        ...(this.hasOwn(dto, 'roleCategory') ? { roleCategory: dto.roleCategory } : {}),
        ...(this.hasOwn(dto, 'title') ? { title: dto.title } : {}),
      },
      select: TEMPLATE_ROADMAP_SELECT,
      where: { id: templateId },
    });

    return this.formatRoadmap(template);
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const result = await this.prisma.roadmap.deleteMany({
      where: {
        id: templateId,
        isTemplate: true,
      },
    });

    if (result.count === 0) {
      throw new RoadmapNotFoundException(templateId);
    }
  }

  async listNodes(templateId: string): Promise<TemplateNodesListResponse> {
    await this.findTemplateOrThrow(templateId);

    const nodes = await this.prisma.roadmapNode.findMany({
      orderBy: [{ posY: 'asc' }, { posX: 'asc' }, { id: 'asc' }],
      select: TEMPLATE_NODE_SELECT,
      where: {
        roadmapId: templateId,
        roadmap: { isTemplate: true },
      },
    });

    return {
      nodes: nodes.map((node) => this.formatNode(node)),
    };
  }

  async createNode(templateId: string, dto: CreateTemplateNodeDto): Promise<TemplateNodeResponse> {
    const template = await this.findTemplateOrThrow(templateId);
    const state = {
      description: dto.description ?? null,
      estimatedHours: dto.estimatedHours ?? null,
      name: dto.name,
      nodeType: dto.nodeType,
      parentId: dto.parentId ?? null,
      skillId: dto.skillId ?? null,
    } satisfies NodeState;

    await this.validateNodeState(template, state);

    const node = await this.prisma.roadmapNode.create({
      data: {
        description: state.description,
        estimatedHours: state.estimatedHours,
        name: state.name,
        nodeType: state.nodeType,
        parentId: state.parentId,
        posX: 0,
        posY: 0,
        roadmapId: templateId,
        skillId: state.skillId,
      },
      select: TEMPLATE_NODE_SELECT,
    });

    await this.recalculateTemplateLayout(templateId);

    return this.formatNode(await this.findNodeOrThrow(templateId, node.id));
  }

  async updateNode(
    templateId: string,
    nodeId: string,
    dto: UpdateTemplateNodeDto,
  ): Promise<TemplateNodeResponse> {
    const template = await this.findTemplateOrThrow(templateId);
    const existingNode = await this.findNodeOrThrow(templateId, nodeId);
    const state = {
      description: this.hasOwn(dto, 'description')
        ? (dto.description ?? null)
        : existingNode.description,
      estimatedHours: this.hasOwn(dto, 'estimatedHours')
        ? (dto.estimatedHours ?? null)
        : existingNode.estimatedHours,
      name: this.hasOwn(dto, 'name') ? dto.name! : existingNode.name,
      nodeType: this.hasOwn(dto, 'nodeType') ? dto.nodeType! : existingNode.nodeType,
      parentId: this.hasOwn(dto, 'parentId') ? (dto.parentId ?? null) : existingNode.parentId,
      skillId: this.hasOwn(dto, 'skillId') ? (dto.skillId ?? null) : existingNode.skillId,
    } satisfies NodeState;

    await this.validateNodeState(template, state, nodeId);

    const node = await this.prisma.roadmapNode.update({
      data: {
        ...(this.hasOwn(dto, 'description') ? { description: state.description } : {}),
        ...(this.hasOwn(dto, 'estimatedHours') ? { estimatedHours: state.estimatedHours } : {}),
        ...(this.hasOwn(dto, 'name') ? { name: state.name } : {}),
        ...(this.hasOwn(dto, 'nodeType') ? { nodeType: state.nodeType } : {}),
        ...(this.hasOwn(dto, 'parentId') ? { parentId: state.parentId } : {}),
        ...(this.hasOwn(dto, 'skillId') ? { skillId: state.skillId } : {}),
      },
      select: TEMPLATE_NODE_SELECT,
      where: { id: nodeId },
    });

    await this.recalculateTemplateLayout(templateId);

    return this.formatNode(await this.findNodeOrThrow(templateId, node.id));
  }

  async deleteNode(templateId: string, nodeId: string): Promise<void> {
    await this.findTemplateOrThrow(templateId);

    const node = await this.prisma.roadmapNode.findFirst({
      select: {
        id: true,
        nodeType: true,
      },
      where: {
        id: nodeId,
        roadmapId: templateId,
        roadmap: { isTemplate: true },
      },
    });

    if (!node) {
      throw new RoadmapNodeNotFoundException(nodeId);
    }

    if (AXIS_NODE_TYPES.includes(node.nodeType)) {
      await this.prisma.$transaction(async (tx) => {
        await tx.roadmapNode.deleteMany({
          where: {
            nodeType: { in: LEAF_NODE_TYPES },
            parentId: nodeId,
            roadmapId: templateId,
          },
        });

        await tx.roadmapNode.deleteMany({
          where: {
            id: nodeId,
            nodeType: { in: AXIS_NODE_TYPES },
            roadmapId: templateId,
          },
        });
      });
      await this.recalculateTemplateLayout(templateId);
      return;
    }

    const result = await this.prisma.roadmapNode.deleteMany({
      where: {
        id: nodeId,
        roadmapId: templateId,
      },
    });

    if (result.count === 0) {
      throw new RoadmapNodeNotFoundException(nodeId);
    }

    await this.recalculateTemplateLayout(templateId);
  }

  private buildTemplateWhere(query: ListAdminTemplatesQueryDto): Prisma.RoadmapWhereInput {
    const where: Prisma.RoadmapWhereInput = {
      isTemplate: true,
    };
    const searchQuery = query.q?.trim();

    if (query.roleCategory) {
      where.roleCategory = query.roleCategory;
    }

    if (searchQuery) {
      where.title = {
        contains: searchQuery,
        mode: 'insensitive',
      };
    }

    return where;
  }

  private async runBulkOperation(
    ids: string[],
    operation: (id: string) => Promise<void>,
  ): Promise<BulkOperationResponse> {
    const result: BulkOperationResponse = {
      failed: [],
      succeeded: [],
    };

    for (const id of ids) {
      try {
        await operation(id);
        result.succeeded.push(id);
      } catch (error) {
        result.failed.push(this.formatBulkFailure(id, error));
      }
    }

    return result;
  }

  private formatBulkFailure(id: string, error: unknown): BulkOperationResponse['failed'][number] {
    if (error instanceof HttpException) {
      const response = error.getResponse();

      if (typeof response === 'object' && response !== null) {
        const errorResponse = response as { code?: number | string; message?: string };

        return {
          code: errorResponse.code === undefined ? undefined : String(errorResponse.code),
          id,
          message: errorResponse.message ?? error.message,
        };
      }

      return {
        id,
        message: error.message,
      };
    }

    return {
      id,
      message: 'Unexpected failure while processing this item.',
    };
  }

  private async findTemplateOrThrow(templateId: string): Promise<SelectedTemplate> {
    const template = await this.prisma.roadmap.findFirst({
      select: TEMPLATE_ROADMAP_SELECT,
      where: {
        id: templateId,
        isTemplate: true,
      },
    });

    if (!template) {
      throw new RoadmapNotFoundException(templateId);
    }

    return template;
  }

  private async findNodeOrThrow(templateId: string, nodeId: string): Promise<SelectedTemplateNode> {
    const node = await this.prisma.roadmapNode.findFirst({
      select: TEMPLATE_NODE_SELECT,
      where: {
        id: nodeId,
        roadmapId: templateId,
        roadmap: { isTemplate: true },
      },
    });

    if (!node) {
      throw new RoadmapNodeNotFoundException(nodeId);
    }

    return node;
  }

  private async validateNodeState(
    template: TemplateSummary,
    state: NodeState,
    currentNodeId?: string,
  ): Promise<void> {
    if (state.estimatedHours !== null) {
      this.assertFiniteNumber('estimatedHours', state.estimatedHours);
      if (this.toNumber(state.estimatedHours) < 0) {
        throw new TemplateNodeInvalidValueException(
          'estimatedHours must be greater than or equal to 0',
        );
      }
    }

    if (state.nodeType === NodeType.GROUP) {
      this.assertNullFields(state, ['parentId', 'skillId', 'description', 'estimatedHours']);
      return;
    }

    if (state.nodeType === NodeType.MILESTONE) {
      this.assertNullFields(state, ['parentId', 'skillId', 'estimatedHours']);
      return;
    }

    if (!LEAF_NODE_TYPES.includes(state.nodeType)) {
      throw new TemplateNodeInvalidShapeException('Unsupported node type');
    }

    if (state.description !== null) {
      throw new TemplateNodeInvalidShapeException('Leaf nodes cannot have descriptions');
    }

    if (!state.parentId) {
      throw new TemplateNodeInvalidReferenceException('Leaf nodes require a parent section');
    }

    if (!state.skillId) {
      throw new TemplateNodeInvalidReferenceException('Leaf nodes require a skill');
    }

    if (state.parentId === currentNodeId) {
      throw new TemplateNodeInvalidReferenceException('Leaf nodes cannot be their own parent');
    }

    const parent = await this.prisma.roadmapNode.findFirst({
      select: { id: true },
      where: {
        id: state.parentId,
        nodeType: { in: AXIS_NODE_TYPES },
        roadmapId: template.id,
        roadmap: { isTemplate: true },
      },
    });

    if (!parent) {
      throw new TemplateNodeInvalidReferenceException(
        'Leaf node parent must be a group or milestone in the same template',
      );
    }

    if (currentNodeId && LEAF_NODE_TYPES.includes(state.nodeType)) {
      const childrenCount = await this.prisma.roadmapNode.count({
        where: {
          parentId: currentNodeId,
          roadmapId: template.id,
        },
      });

      if (childrenCount > 0) {
        throw new TemplateNodeInvalidShapeException(
          'Section nodes with children cannot be converted to leaf nodes',
        );
      }
    }

    const skill = await this.prisma.skill.findUnique({
      select: {
        id: true,
        roleCategory: true,
      },
      where: { id: state.skillId },
    });

    if (!skill) {
      throw new SkillNotFoundException(state.skillId);
    }

    if (skill.roleCategory && skill.roleCategory !== template.roleCategory) {
      throw new TemplateNodeInvalidReferenceException(
        'Skill role category does not match the template',
      );
    }
  }

  private async recalculateTemplateLayout(templateId: string): Promise<void> {
    const nodes = await this.prisma.roadmapNode.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: TEMPLATE_NODE_SELECT,
      where: {
        roadmapId: templateId,
        roadmap: { isTemplate: true },
      },
    });

    if (nodes.length === 0) {
      return;
    }

    const flatNodes = nodes.map<FlatNode>((node) => ({
      description: node.description,
      estimatedHours: this.formatDecimal(node.estimatedHours),
      name: node.name,
      nodeType: node.nodeType,
      realId: node.id,
      realParentId: node.parentId,
      skillId: node.skillId,
      tempId: node.id,
      tempParentId: node.parentId,
    }));
    const layout = this.dagreLayout.computeLayout(flatNodes);

    await this.prisma.$transaction(
      nodes.map((node) => {
        const position = layout.get(node.id) ?? { posX: 0, posY: 0 };

        return this.prisma.roadmapNode.updateMany({
          data: {
            posX: position.posX,
            posY: position.posY,
          },
          where: {
            id: node.id,
            roadmapId: templateId,
          },
        });
      }),
    );
  }

  private assertNullFields(state: NodeState, fields: Array<keyof NodeState>): void {
    for (const field of fields) {
      if (state[field] !== null) {
        throw new TemplateNodeInvalidShapeException(
          `${String(field)} must be null for ${state.nodeType} nodes`,
        );
      }
    }
  }

  private assertFiniteNumber(field: string, value: DecimalLike | number): void {
    const numericValue = this.toNumber(value);

    if (!Number.isFinite(numericValue)) {
      throw new TemplateNodeInvalidValueException(`${field} must be a finite number`);
    }
  }

  private formatRoadmap(roadmap: SelectedTemplate): RoadmapResponseDto {
    return {
      deadlineDate: this.formatDateOnly(roadmap.deadlineDate),
      description: roadmap.description,
      estimatedWeeks: roadmap.estimatedWeeks,
      generatedAt: roadmap.generatedAt.toISOString(),
      goalName: roadmap.goalName,
      hoursPerDay: this.formatDecimal(roadmap.hoursPerDay),
      id: roadmap.id,
      isTemplate: roadmap.isTemplate,
      roleCategory: roadmap.roleCategory,
      startedAt: null,
      title: roadmap.title,
      updatedAt: roadmap.updatedAt.toISOString(),
      userId: roadmap.userId,
    };
  }

  private formatNode(node: SelectedTemplateNode): TemplateNodeResponse {
    return {
      createdAt: node.createdAt.toISOString(),
      description: node.description,
      estimatedHours: this.formatDecimal(node.estimatedHours),
      id: node.id,
      name: node.name,
      nodeType: node.nodeType,
      parentId: node.parentId,
      posX: this.formatDecimal(node.posX) ?? 0,
      posY: this.formatDecimal(node.posY) ?? 0,
      roadmapId: node.roadmapId,
      skillId: node.skillId,
    };
  }

  private formatDateOnly(date: Date | null): null | string {
    return date ? date.toISOString().slice(0, 10) : null;
  }

  private formatDecimal(value: DecimalLike | null | number): null | number {
    return value === null ? null : this.toNumber(value);
  }

  private hasOwn(object: object, key: string): boolean {
    return Object.hasOwn(object, key) && (object as Record<string, unknown>)[key] !== undefined;
  }

  private toNumber(value: DecimalLike | number): number {
    return typeof value === 'number'
      ? value
      : typeof value.toNumber === 'function'
        ? value.toNumber()
        : Number(value.toString());
  }
}
