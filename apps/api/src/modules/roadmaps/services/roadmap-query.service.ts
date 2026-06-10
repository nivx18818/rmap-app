import { Injectable } from '@nestjs/common';
import { NodeStatus, NodeType, type Prisma } from '@repo/db/prisma/client';

import {
  RoadmapNodeNotFoundException,
  RoadmapNotFoundException,
} from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { ListRoadmapsQueryDto } from '../dto/list-roadmaps-query.dto';
import type { RoadmapNodesFilterDto } from '../dto/roadmap-nodes-filter.dto';
import type { PaginatedRoadmapsResponseDto, RoadmapResponseDto } from '../dto/roadmap-response.dto';
import type { NodeDetailResponse, RoadmapNodesListResponse } from '../types/roadmap-nodes.types';
import type { MilestoneSubmissionRecord } from '../utils/roadmap-records';

import {
  LEAF_NODE_TYPES,
  MILESTONE_SUBMISSION_SELECT,
  MILESTONE_TEST_SUITE_SELECT,
  NODE_DETAIL_RESOURCE_LIMIT,
  RESOURCE_TYPE_PRIORITY,
  ROADMAP_SELECT,
} from '../constants/roadmap.constants';
import { toNumberOrNull } from '../utils/number';
import { getRoadmapAccessWhere, getRoadmapRelationAccessWhere } from '../utils/roadmap-access';
import {
  formatMilestoneSubmission,
  formatNodeWithProgress,
  formatRoadmap,
} from '../utils/roadmap-formatters';
import { RoadmapMilestoneService } from './roadmap-milestone.service';

@Injectable()
export class RoadmapQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roadmapMilestone: RoadmapMilestoneService,
  ) {}

  async listUserRoadmaps(
    userId: string,
    query: ListRoadmapsQueryDto,
  ): Promise<PaginatedRoadmapsResponseDto> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;
    const where = {
      isTemplate: false,
      userId,
    } satisfies Prisma.RoadmapWhereInput;

    const [roadmaps, total] = await this.prisma.$transaction([
      this.prisma.roadmap.findMany({
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: ROADMAP_SELECT,
        skip,
        take: perPage,
        where,
      }),
      this.prisma.roadmap.count({ where }),
    ]);
    const startedAtByRoadmapId = await this.findStartedAtByRoadmapId(
      userId,
      roadmaps.map((roadmap) => roadmap.id),
    );

    return {
      data: roadmaps.map((roadmap) =>
        formatRoadmap(roadmap, startedAtByRoadmapId.get(roadmap.id) ?? null),
      ),
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async listNodes(
    userId: string,
    roadmapId: string,
    query: RoadmapNodesFilterDto,
  ): Promise<RoadmapNodesListResponse> {
    const { nodeType, status, q } = query;
    const trimmedQuery = q?.trim();

    const where: Prisma.RoadmapNodeWhereInput = {
      roadmapId,
      roadmap: getRoadmapRelationAccessWhere(userId),
    };

    if (nodeType) {
      where.nodeType = nodeType;
    }

    if (status) {
      where.userNodeProgress = {
        some: {
          userId,
          status,
        },
      };
    }

    if (trimmedQuery) {
      where.name = { contains: trimmedQuery, mode: 'insensitive' };
    }

    const nodes = await this.prisma.roadmapNode.findMany({
      where,
      select: {
        id: true,
        roadmapId: true,
        parentId: true,
        skillId: true,
        name: true,
        description: true,
        nodeType: true,
        estimatedHours: true,
        posX: true,
        posY: true,
        skill: {
          select: {
            _count: {
              select: {
                resources: true,
              },
            },
          },
        },
        userNodeProgress: {
          where: { userId },
          select: {
            id: true,
            roadmapNodeId: true,
            status: true,
            startedAt: true,
            completedAt: true,
            quizScorePct: true,
            quizPassed: true,
          },
        },
      },
    });

    return {
      nodes: nodes.map((node) => formatNodeWithProgress(node)),
    };
  }

  async getNodeDetail(
    userId: string,
    roadmapId: string,
    nodeId: string,
  ): Promise<NodeDetailResponse> {
    const node = await this.prisma.roadmapNode.findFirst({
      where: {
        id: nodeId,
        roadmapId,
        roadmap: getRoadmapRelationAccessWhere(userId),
      },
      select: {
        id: true,
        roadmapId: true,
        parentId: true,
        skillId: true,
        name: true,
        description: true,
        nodeType: true,
        estimatedHours: true,
        posX: true,
        posY: true,
        roadmap: {
          select: {
            roleCategory: true,
          },
        },
        userNodeProgress: {
          where: { userId },
          select: {
            id: true,
            roadmapNodeId: true,
            status: true,
            startedAt: true,
            completedAt: true,
            quizScorePct: true,
            quizPassed: true,
          },
        },
        milestoneSubmissions: {
          where: { userId },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: MILESTONE_SUBMISSION_SELECT,
          take: 1,
        },
        milestoneTestSuite: {
          select: MILESTONE_TEST_SUITE_SELECT,
        },
        skill: {
          select: {
            id: true,
            name: true,
            description: true,
            defaultEstimatedHours: true,
            roleCategory: true,
            resources: {
              orderBy: [
                { isPrimary: 'desc' },
                { isFree: 'desc' },
                { createdAt: 'asc' },
                { id: 'asc' },
              ],
              select: {
                id: true,
                createdAt: true,
                title: true,
                url: true,
                resourceType: true,
                isFree: true,
                isPrimary: true,
              },
            },
            prerequisites: {
              select: {
                prerequisiteSkillId: true,
                prerequisiteSkill: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!node) {
      throw new RoadmapNodeNotFoundException(nodeId);
    }

    const nodeResponse = formatNodeWithProgress(node);
    const latestSubmission =
      node.nodeType === NodeType.MILESTONE
        ? formatMilestoneSubmission(
            this.getCurrentCycleMilestoneSubmission(
              node.userNodeProgress[0]?.startedAt,
              node.milestoneSubmissions[0],
            ),
          )
        : null;
    const milestoneTestSuite =
      node.nodeType === NodeType.MILESTONE
        ? await this.roadmapMilestone.resolveMilestoneTestSuiteForNodeDetail({
            existingSuite: node.milestoneTestSuite,
            nodeId: node.id,
            nodeName: node.name,
            projectBrief: node.description ?? node.name,
            roleCategory: node.roadmap.roleCategory,
            status: node.userNodeProgress[0]?.status ?? NodeStatus.LOCKED,
          })
        : null;

    if (!LEAF_NODE_TYPES.includes(node.nodeType) || !node.skill) {
      return {
        node: nodeResponse,
        skill: null,
        resources: null,
        prerequisites: [],
        latestSubmission,
        milestoneTestSuite,
      };
    }

    const orderedResources = [...node.skill.resources]
      .sort(
        (a, b) =>
          Number(b.isPrimary) - Number(a.isPrimary) ||
          Number(b.isFree) - Number(a.isFree) ||
          RESOURCE_TYPE_PRIORITY[a.resourceType] - RESOURCE_TYPE_PRIORITY[b.resourceType] ||
          a.createdAt.getTime() - b.createdAt.getTime() ||
          a.id - b.id,
      )
      .slice(0, NODE_DETAIL_RESOURCE_LIMIT);
    const orderedPrerequisites = [...node.skill.prerequisites].sort(
      (a, b) =>
        a.prerequisiteSkill.name.localeCompare(b.prerequisiteSkill.name) ||
        a.prerequisiteSkillId.localeCompare(b.prerequisiteSkillId),
    );

    return {
      node: nodeResponse,
      skill: {
        id: node.skill.id,
        name: node.skill.name,
        description: node.skill.description,
        defaultEstimatedHours: toNumberOrNull(node.skill.defaultEstimatedHours),
        roleCategory: node.skill.roleCategory,
      },
      resources: orderedResources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        url: resource.url,
        resourceType: resource.resourceType,
        isFree: resource.isFree,
        isPrimary: resource.isPrimary,
      })),
      prerequisites: orderedPrerequisites.map((prerequisite) => ({
        skillId: prerequisite.prerequisiteSkillId,
        skillName: prerequisite.prerequisiteSkill.name,
      })),
      latestSubmission,
      milestoneTestSuite,
    };
  }

  async getByIdForOwner(userId: string, roadmapId: string): Promise<RoadmapResponseDto> {
    const roadmap = await this.prisma.roadmap.findFirst({
      select: ROADMAP_SELECT,
      where: getRoadmapAccessWhere(userId, roadmapId),
    });

    if (!roadmap) {
      throw new RoadmapNotFoundException(roadmapId);
    }

    const startedAtByRoadmapId = await this.findStartedAtByRoadmapId(userId, [roadmap.id]);

    return formatRoadmap(roadmap, startedAtByRoadmapId.get(roadmap.id) ?? null);
  }

  async deleteByIdForOwner(userId: string, roadmapId: string): Promise<void> {
    const result = await this.prisma.roadmap.deleteMany({
      where: {
        id: roadmapId,
        isTemplate: false,
        userId,
      },
    });

    if (result.count === 0) {
      throw new RoadmapNotFoundException(roadmapId);
    }
  }

  private getCurrentCycleMilestoneSubmission(
    progressStartedAt: Date | null | undefined,
    submission: MilestoneSubmissionRecord | null | undefined,
  ): MilestoneSubmissionRecord | null {
    if (!progressStartedAt || !submission || submission.createdAt < progressStartedAt) {
      return null;
    }

    return submission;
  }

  private async findStartedAtByRoadmapId(
    userId: string,
    roadmapIds: string[],
  ): Promise<Map<string, Date>> {
    if (roadmapIds.length === 0) {
      return new Map();
    }

    const progressRows = await this.prisma.userNodeProgress.findMany({
      where: {
        userId,
        startedAt: { not: null },
        roadmapNode: { roadmapId: { in: roadmapIds } },
      },
      orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
      select: {
        startedAt: true,
        roadmapNode: { select: { roadmapId: true } },
      },
    });

    const startedAtByRoadmapId = new Map<string, Date>();

    for (const progress of progressRows) {
      if (progress.startedAt && !startedAtByRoadmapId.has(progress.roadmapNode.roadmapId)) {
        startedAtByRoadmapId.set(progress.roadmapNode.roadmapId, progress.startedAt);
      }
    }

    return startedAtByRoadmapId;
  }
}
