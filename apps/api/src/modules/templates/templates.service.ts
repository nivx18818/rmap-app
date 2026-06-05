import { Injectable } from '@nestjs/common';
import {
  NodeStatus,
  NodeType,
  RoleCategory,
  type Prisma,
  type Roadmap,
} from '@repo/db/prisma/client';

import type {
  PaginatedRoadmapsResponseDto,
  RoadmapResponseDto,
} from '@/modules/roadmaps/dto/roadmap-response.dto';

import { RoadmapNotFoundException } from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { ListTemplatesQueryDto } from './dto/list-templates-query.dto';
import type { TemplateCategoriesResponseDto } from './dto/template-categories-response.dto';
import type {
  TemplateRoadmapNodeDto,
  TemplateRoadmapNodesResponseDto,
} from './dto/template-node-response.dto';
import type { TemplateNodesFilterDto } from './dto/template-nodes-filter.dto';
import type {
  TemplateRecommendationRoadmapDto,
  TemplateRecommendationsResponseDto,
} from './dto/template-recommendations-response.dto';
import type {
  TemplateTrendingRoadmapDto,
  TemplateTrendingsResponseDto,
} from './dto/template-trendings-response.dto';

const TRENDING_TEMPLATES_LIMIT = 5;
const TREND_TEXT_OPTIONS = [
  'Popular this month',
  'Popular this week',
  'Trending now',
  'New favorite',
];
const LEARNER_TREND_TEXT_WEIGHT = 0.4;
const MAX_RANDOM_LEARNERS = 500;

const COMPACT_CATEGORY_LABELS = {
  [RoleCategory.WEB_DEVELOPMENT]: 'Web',
  [RoleCategory.FRAMEWORKS]: 'Frameworks',
  [RoleCategory.ABSOLUTE_BEGINNERS]: 'Beginner',
  [RoleCategory.LANGUAGES_AND_PLATFORMS]: 'Languages',
  [RoleCategory.DEVOPS]: 'DevOps',
  [RoleCategory.DATABASES]: 'Databases',
  [RoleCategory.COMPUTER_SCIENCE]: 'CS',
  [RoleCategory.DESIGN]: 'Design',
  [RoleCategory.BEST_PRACTICES]: 'Best Practices',
  [RoleCategory.AI_AND_MACHINE_LEARNING]: 'AI',
  [RoleCategory.DATA_ANALYSIS]: 'Data',
  [RoleCategory.MOBILE_DEVELOPMENT]: 'Mobile',
  [RoleCategory.MANAGEMENT]: 'Management',
  [RoleCategory.GAME_DEVELOPMENT]: 'Game',
  [RoleCategory.BLOCKCHAIN]: 'Blockchain',
  [RoleCategory.CYBER_SECURITY]: 'Security',
} satisfies Record<RoleCategory, string>;

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
  skill: {
    select: {
      _count: {
        select: {
          resources: true,
        },
      },
    },
  },
  skillId: true,
} satisfies Prisma.RoadmapNodeSelect;

const NODE_DETAIL_RESOURCE_LIMIT = 5;

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
  skill: {
    _count: {
      resources: number;
    };
  } | null;
  skillId: string | null;
};

type ActiveLearningRoadmapRecord = {
  id: string;
  isTemplate: boolean;
  roleCategory: RoleCategory;
  nodes: Array<{
    userNodeProgress: Array<{
      startedAt: Date | null;
      status: NodeStatus;
    }>;
  }>;
};

type RecommendedTemplateRoadmapRecord = {
  description: string | null;
  estimatedWeeks: number | null;
  goalName: string | null;
  id: string;
  nodes: Array<{
    nodeType: NodeType;
  }>;
  roleCategory: RoleCategory;
  title: string;
};

type TrendingTemplateRoadmapRecord = {
  estimatedWeeks: number | null;
  id: string;
  nodes: Array<{
    nodeType: NodeType;
  }>;
  roleCategory: RoleCategory;
  title: string;
};

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(): Promise<TemplateCategoriesResponseDto> {
    const groupedTemplates = await this.prisma.roadmap.groupBy({
      by: ['roleCategory'],
      where: { isTemplate: true },
      _count: { _all: true },
    });
    const countByCategory = new Map(
      groupedTemplates.map((group) => [group.roleCategory, group._count._all]),
    );
    const categories = Object.values(RoleCategory).map((category) => ({
      category,
      label: this.formatRoleCategory(category),
      shortLabel: this.formatCompactRoleCategory(category),
      templatesCount: countByCategory.get(category) ?? 0,
    }));

    return {
      total: categories.length,
      categories,
    };
  }

  async listTemplates(query: ListTemplatesQueryDto): Promise<PaginatedRoadmapsResponseDto> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;
    const where: Prisma.RoadmapWhereInput = {
      isTemplate: true,
      nodes: { some: {} },
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

  async listTrendings(): Promise<TemplateTrendingsResponseDto> {
    const templates = await this.prisma.roadmap.findMany({
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
    const trendings = this.shuffle(templates)
      .slice(0, TRENDING_TEMPLATES_LIMIT)
      .map((template, index) => this.formatTrendingTemplateRoadmap(template, index + 1));

    return {
      total: trendings.length,
      trendings,
    };
  }

  async getRecommendations(userId: string): Promise<TemplateRecommendationsResponseDto> {
    const activeRoadmaps = (await this.findActiveLearningRoadmaps(userId)).filter(
      (roadmap) => this.getStartedAt(roadmap) !== null && !this.isRoadmapCompleted(roadmap),
    );
    const roleCategories = this.getUniqueRoleCategories(activeRoadmaps);

    if (roleCategories.length === 0) {
      return {
        roleCategories: [],
        total: 0,
        relevantRoadmaps: [],
      };
    }

    const activeTemplateIds = activeRoadmaps
      .filter((roadmap) => roadmap.isTemplate)
      .map((roadmap) => roadmap.id);
    const relevantRoadmaps = await this.findRecommendedTemplates(
      userId,
      roleCategories,
      activeTemplateIds,
    );

    return {
      roleCategories: roleCategories.map((category) => ({
        category,
        label: this.formatRoleCategory(category),
      })),
      total: relevantRoadmaps.length,
      relevantRoadmaps: relevantRoadmaps.map((roadmap) =>
        this.formatRecommendedTemplateRoadmap(roadmap),
      ),
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

  private async findActiveLearningRoadmaps(userId: string): Promise<ActiveLearningRoadmapRecord[]> {
    return this.prisma.roadmap.findMany({
      where: {
        OR: [
          {
            isTemplate: false,
            nodes: {
              some: {
                userNodeProgress: {
                  some: {
                    startedAt: { not: null },
                    userId,
                  },
                },
              },
            },
            userId,
          },
          {
            isTemplate: true,
            nodes: {
              some: {
                userNodeProgress: {
                  some: {
                    startedAt: { not: null },
                    userId,
                  },
                },
              },
            },
          },
        ],
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      select: {
        id: true,
        isTemplate: true,
        roleCategory: true,
        nodes: {
          select: {
            userNodeProgress: {
              where: { userId },
              select: { startedAt: true, status: true },
            },
          },
        },
      },
    });
  }

  private async findRecommendedTemplates(
    userId: string,
    roleCategories: RoleCategory[],
    excludedTemplateIds: string[],
  ): Promise<RecommendedTemplateRoadmapRecord[]> {
    return this.prisma.roadmap.findMany({
      where: {
        ...(excludedTemplateIds.length > 0 ? { id: { notIn: excludedTemplateIds } } : {}),
        isTemplate: true,
        roleCategory: { in: roleCategories },
        NOT: {
          nodes: {
            some: {
              userNodeProgress: {
                some: {
                  startedAt: { not: null },
                  userId,
                },
              },
            },
          },
        },
      },
      orderBy: [{ roleCategory: 'asc' }, { updatedAt: 'desc' }, { id: 'asc' }],
      select: {
        description: true,
        estimatedWeeks: true,
        goalName: true,
        id: true,
        nodes: {
          select: { nodeType: true },
        },
        roleCategory: true,
        title: true,
      },
    });
  }

  private getUniqueRoleCategories(roadmaps: ActiveLearningRoadmapRecord[]): RoleCategory[] {
    return Array.from(new Set(roadmaps.map((roadmap) => roadmap.roleCategory))).sort((a, b) =>
      a.localeCompare(b),
    );
  }

  private formatRecommendedTemplateRoadmap(
    roadmap: RecommendedTemplateRoadmapRecord,
  ): TemplateRecommendationRoadmapDto {
    return {
      roadmapId: roadmap.id,
      title: roadmap.title,
      description: roadmap.description,
      goalName: roadmap.goalName,
      roleCategory: roadmap.roleCategory,
      categoryLabel: this.formatRoleCategory(roadmap.roleCategory),
      estimatedWeeks: roadmap.estimatedWeeks,
      durationLabel: this.formatDurationLabel(roadmap.estimatedWeeks),
      nodesTotal: roadmap.nodes.length,
      requiredNodesTotal: roadmap.nodes.filter((node) => node.nodeType === NodeType.REQUIRED)
        .length,
    };
  }

  private formatTrendingTemplateRoadmap(
    roadmap: TrendingTemplateRoadmapRecord,
    rank: number,
  ): TemplateTrendingRoadmapDto {
    return {
      rank,
      roadmapId: roadmap.id,
      title: roadmap.title,
      roleCategory: roadmap.roleCategory,
      categoryLabel: this.formatRoleCategory(roadmap.roleCategory),
      estimatedWeeks: roadmap.estimatedWeeks,
      durationLabel: this.formatDurationLabel(roadmap.estimatedWeeks),
      nodesTotal: roadmap.nodes.length,
      trendText: this.pickRandomTrendText(),
    };
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
      resourcesCount: Math.min(node.skill?._count.resources ?? 0, NODE_DETAIL_RESOURCE_LIMIT),
      skillId: node.skillId,
    };
  }

  private formatDateOnly(date: Date | null): null | string {
    return date ? date.toISOString().slice(0, 10) : null;
  }

  private getStartedAt(roadmap: ActiveLearningRoadmapRecord): Date | null {
    return (
      roadmap.nodes
        .flatMap((node) => node.userNodeProgress)
        .map((progress) => progress.startedAt)
        .filter((startedAt): startedAt is Date => startedAt !== null)
        .sort((a, b) => a.getTime() - b.getTime())[0] ?? null
    );
  }

  private isRoadmapCompleted(roadmap: ActiveLearningRoadmapRecord): boolean {
    return (
      roadmap.nodes.length > 0 &&
      roadmap.nodes.every((node) => node.userNodeProgress[0]?.status === NodeStatus.COMPLETED)
    );
  }

  private formatDurationLabel(estimatedWeeks: number | null): string | null {
    if (!estimatedWeeks || estimatedWeeks <= 0) {
      return null;
    }

    if (estimatedWeeks < 4) {
      return `${estimatedWeeks} week${estimatedWeeks === 1 ? '' : 's'}`;
    }

    const months = Math.max(1, Math.round(estimatedWeeks / 4));

    return `${months} month${months === 1 ? '' : 's'}`;
  }

  private pickRandomTrendText(): string {
    if (Math.random() < LEARNER_TREND_TEXT_WEIGHT) {
      const learners = Math.floor(Math.random() * MAX_RANDOM_LEARNERS) + 1;

      return `${learners} learners`;
    }

    return TREND_TEXT_OPTIONS[Math.floor(Math.random() * TREND_TEXT_OPTIONS.length)]!;
  }

  private shuffle<T>(items: T[]): T[] {
    const shuffled = [...items];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      const item = shuffled[index]!;
      shuffled[index] = shuffled[swapIndex]!;
      shuffled[swapIndex] = item;
    }

    return shuffled;
  }

  private formatRoleCategory(value: RoleCategory): string {
    return value
      .split('_')
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
      .join(' ');
  }

  private formatCompactRoleCategory(value: RoleCategory): string {
    return COMPACT_CATEGORY_LABELS[value] ?? this.formatRoleCategory(value);
  }

  private formatDecimal(value: DecimalLike | null): null | number {
    if (!value) {
      return null;
    }

    return typeof value.toNumber === 'function' ? value.toNumber() : Number(value.toString());
  }
}
