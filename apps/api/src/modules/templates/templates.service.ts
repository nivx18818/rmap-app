import { Injectable } from '@nestjs/common';
import { type NodeType, type Prisma, type Roadmap } from '@repo/db/prisma/client';

import type {
  PaginatedRoadmapsResponseDto,
  RoadmapResponseDto,
} from '@/modules/roadmaps/dto/roadmap-response.dto';

import { RoadmapNotFoundException } from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { ListTemplatesQueryDto } from './dto/list-templates-query.dto';
import type {
  TemplateRoadmapNodeDto,
  TemplateRoadmapNodesResponseDto,
} from './dto/template-node-response.dto';
import type { TemplateNodesFilterDto } from './dto/template-nodes-filter.dto';

const ROADMAP_SELECT = {
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

type SelectedRoadmap = Pick<Roadmap, keyof typeof ROADMAP_SELECT>;

type DecimalLike = {
  toNumber?: () => number;
  toString: () => string;
};

type SelectedTemplateNode = {
  description: string | null;
  estimatedHours: Prisma.Decimal | number | null;
  id: string;
  name: string;
  nodeType: NodeType;
  parentId: string | null;
  posX: Prisma.Decimal | number;
  posY: Prisma.Decimal | number;
  roadmapId: string;
  skillId: string | null;
};

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async listTemplates(query: ListTemplatesQueryDto): Promise<PaginatedRoadmapsResponseDto> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;
    const where: Prisma.RoadmapWhereInput = {
      isTemplate: true,
    };

    if (query.roleCategory) {
      where.roleCategory = query.roleCategory;
    }

    const [templates, total] = await this.prisma.$transaction([
      this.prisma.roadmap.findMany({
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: ROADMAP_SELECT,
        skip,
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

  async getTemplate(templateId: string): Promise<RoadmapResponseDto> {
    const template = await this.prisma.roadmap.findFirst({
      select: ROADMAP_SELECT,
      where: {
        id: templateId,
        isTemplate: true,
      },
    });

    if (!template) {
      throw new RoadmapNotFoundException(templateId);
    }

    return this.formatRoadmap(template);
  }

  async listTemplateNodes(
    templateId: string,
    query: TemplateNodesFilterDto,
  ): Promise<TemplateRoadmapNodesResponseDto> {
    await this.assertTemplateExists(templateId);

    const where: Prisma.RoadmapNodeWhereInput = {
      roadmapId: templateId,
    };

    if (query.nodeType) {
      where.nodeType = query.nodeType;
    }

    const nodes = await this.prisma.roadmapNode.findMany({
      orderBy: [{ posY: 'asc' }, { posX: 'asc' }, { id: 'asc' }],
      select: TEMPLATE_NODE_SELECT,
      where,
    });

    return {
      nodes: nodes.map((node) => this.formatTemplateNode(node)),
    };
  }

  private async assertTemplateExists(templateId: string): Promise<void> {
    const template = await this.prisma.roadmap.findFirst({
      select: { id: true },
      where: {
        id: templateId,
        isTemplate: true,
      },
    });

    if (!template) {
      throw new RoadmapNotFoundException(templateId);
    }
  }

  private formatRoadmap(roadmap: SelectedRoadmap): RoadmapResponseDto {
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

  private formatTemplateNode(node: SelectedTemplateNode): TemplateRoadmapNodeDto {
    return {
      description: node.description,
      estimatedHours: this.formatDecimal(node.estimatedHours),
      id: node.id,
      name: node.name,
      nodeType: node.nodeType,
      parentId: node.parentId,
      posX: Number(node.posX),
      posY: Number(node.posY),
      roadmapId: node.roadmapId,
      skillId: node.skillId,
    };
  }

  private formatDateOnly(date: Date | null): null | string {
    return date ? date.toISOString().slice(0, 10) : null;
  }

  private formatDecimal(value: DecimalLike | null): null | number {
    if (!value) {
      return null;
    }

    return typeof value.toNumber === 'function' ? value.toNumber() : Number(value.toString());
  }
}
