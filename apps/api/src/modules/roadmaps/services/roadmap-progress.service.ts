import { Injectable } from '@nestjs/common';
import {
  MilestoneSubmissionStatus,
  NodeStatus,
  NodeType,
  type Prisma,
} from '@repo/db/prisma/client';

import {
  AppConflictException,
  InvalidStatusTransitionException,
  QuizNotPassedException,
  RoadmapNodeProgressInvalidUpdateException,
  RoadmapNodeNotFoundException,
  RoadmapNotFoundException,
  UserNodeProgressNotFoundException,
} from '@/common/exceptions/app.exceptions';
import { calculateStreakDays, type StreakActivityRecord } from '@/common/utils/streak-days.util';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { UpdateNodeProgressDto } from '../dto/update-node-progress.dto';
import type {
  StartRoadmapResponse,
  UpdateNodeProgressResponse,
} from '../types/roadmap-nodes.types';
import type { RoadmapProgressSummaryResponse } from '../types/roadmap-progress.types';
import type { RoadmapTransaction } from '../utils/roadmap-records';

import {
  LEAF_NODE_TYPES,
  ROADMAP_SELECT,
  VALID_TRANSITIONS,
  MAX_ACTIVE_LEARNING_ROADMAPS,
} from '../constants/roadmap.constants';
import { toNumberOrNull } from '../utils/number';
import { getRoadmapAccessWhere, getRoadmapRelationAccessWhere } from '../utils/roadmap-access';
import { formatRoadmap } from '../utils/roadmap-formatters';
import { acquireUserRoadmapLock } from '../utils/roadmap-lock';
import {
  calculateDeadlineTimelineWarning,
  calculatePercent,
  calculateTimelineWarning,
  isNodeCompleted,
} from '../utils/timeline';

@Injectable()
export class RoadmapProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgressSummary(
    userId: string,
    roadmapId: string,
  ): Promise<RoadmapProgressSummaryResponse> {
    const roadmap = await this.prisma.roadmap.findFirst({
      where: getRoadmapAccessWhere(userId, roadmapId),
      select: {
        deadlineDate: true,
        generatedAt: true,
        hoursPerDay: true,
        id: true,
      },
    });

    if (!roadmap) {
      throw new RoadmapNotFoundException(roadmapId);
    }

    const [nodes, dailyActivities] = await this.prisma.$transaction([
      this.prisma.roadmapNode.findMany({
        where: { roadmapId },
        select: {
          id: true,
          nodeType: true,
          estimatedHours: true,
          userNodeProgress: {
            where: { userId },
            select: { status: true },
          },
        },
      }),
      this.prisma.dailyActivity.findMany({
        where: { userId },
        orderBy: [{ activityDate: 'desc' }, { id: 'asc' }],
        select: {
          activityDate: true,
          nodesCompleted: true,
        },
      }),
    ]);

    const nodesTotal = nodes.length;
    const completedNodes = nodes.filter((node) => isNodeCompleted(node));
    const nodesCompleted = completedNodes.length;
    const requiredLeafNodes = nodes.filter((node) => node.nodeType === NodeType.REQUIRED);
    const requiredLeafNodesCompleted = requiredLeafNodes.filter((node) =>
      isNodeCompleted(node),
    ).length;
    const completedHours = completedNodes.reduce(
      (total, node) => total + (toNumberOrNull(node.estimatedHours) ?? 0),
      0,
    );
    const totalLeafEstimatedHours = nodes
      .filter((node) => LEAF_NODE_TYPES.includes(node.nodeType))
      .reduce((total, node) => total + (toNumberOrNull(node.estimatedHours) ?? 0), 0);
    const remainingEstimatedHours = Math.max(0, totalLeafEstimatedHours - completedHours);
    const hoursPerDay = toNumberOrNull(roadmap.hoursPerDay);
    const deadlineTimelineWarning =
      roadmap.deadlineDate && hoursPerDay
        ? calculateDeadlineTimelineWarning(
            roadmap.deadlineDate,
            hoursPerDay,
            remainingEstimatedHours,
            new Date(),
            'The remaining roadmap estimate',
          )
        : null;

    return {
      roadmapId: roadmap.id,
      completionPct: calculatePercent(nodesCompleted, nodesTotal),
      streakDays: calculateStreakDays(dailyActivities as StreakActivityRecord[]),
      skillReadinessPct: calculatePercent(requiredLeafNodesCompleted, requiredLeafNodes.length),
      nodesTotal,
      nodesCompleted,
      timelineWarning:
        deadlineTimelineWarning ??
        calculateTimelineWarning(roadmap.generatedAt, hoursPerDay, completedHours),
    };
  }

  async updateNodeProgress(
    userId: string,
    roadmapId: string,
    nodeId: string,
    dto: UpdateNodeProgressDto,
  ): Promise<UpdateNodeProgressResponse> {
    const node = await this.prisma.roadmapNode.findFirst({
      where: { id: nodeId, roadmapId, roadmap: getRoadmapRelationAccessWhere(userId) },
      select: { id: true, nodeType: true, parentId: true, posY: true },
    });

    if (!node) {
      throw new RoadmapNodeNotFoundException(nodeId);
    }

    if (node.nodeType === NodeType.GROUP) {
      throw new RoadmapNodeProgressInvalidUpdateException(
        'Group nodes are structural and cannot be manually updated',
      );
    }

    const currentProgress = await this.prisma.userNodeProgress.findUnique({
      where: { userId_roadmapNodeId: { userId, roadmapNodeId: nodeId } },
      select: { status: true, quizPassed: true },
    });

    if (!currentProgress) {
      throw new UserNodeProgressNotFoundException(nodeId);
    }

    const allowed = VALID_TRANSITIONS[currentProgress.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new InvalidStatusTransitionException(currentProgress.status, dto.status);
    }

    if (LEAF_NODE_TYPES.includes(node.nodeType) && dto.status === NodeStatus.COMPLETED) {
      if (!currentProgress.quizPassed) {
        throw new QuizNotPassedException();
      }
    }

    if (node.nodeType === NodeType.MILESTONE && dto.status === NodeStatus.COMPLETED) {
      throw new RoadmapNodeProgressInvalidUpdateException(
        'Milestone completion is automatic after generated tests pass',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      const updatedProgress = await tx.userNodeProgress.update({
        where: { userId_roadmapNodeId: { userId, roadmapNodeId: nodeId } },
        data: {
          status: dto.status,
          ...(dto.status === NodeStatus.IN_PROGRESS ? { startedAt: now } : {}),
          ...(dto.status === NodeStatus.COMPLETED ? { completedAt: now } : {}),
        },
        select: {
          id: true,
          roadmapNodeId: true,
          status: true,
          startedAt: true,
          completedAt: true,
          quizScorePct: true,
          quizPassed: true,
        },
      });

      const unlockedNodes =
        dto.status === NodeStatus.COMPLETED
          ? await this.applyCompletionSideEffects(userId, nodeId, roadmapId, now, tx)
          : [];

      return {
        progress: {
          id: updatedProgress.id,
          roadmapNodeId: updatedProgress.roadmapNodeId,
          status: updatedProgress.status,
          startedAt: updatedProgress.startedAt,
          completedAt: updatedProgress.completedAt,
          quizScorePct: toNumberOrNull(updatedProgress.quizScorePct),
          quizPassed: updatedProgress.quizPassed,
        },
        unlockedNodes,
      };
    });
  }

  async applyCompletionSideEffects(
    userId: string,
    roadmapNodeId: string,
    roadmapId: string,
    now: Date,
    tx: RoadmapTransaction,
  ): Promise<string[]> {
    const unlockedNodes: string[] = [];
    const node = await tx.roadmapNode.findFirst({
      where: { id: roadmapNodeId, roadmapId },
      select: { nodeType: true, parentId: true, posY: true },
    });

    if (!node) return unlockedNodes;

    if (LEAF_NODE_TYPES.includes(node.nodeType)) {
      const today = new Date(now);
      today.setUTCHours(0, 0, 0, 0);

      await tx.dailyActivity.upsert({
        where: { userId_activityDate: { userId, activityDate: today } },
        create: { userId, activityDate: today, nodesCompleted: 1 },
        update: { nodesCompleted: { increment: 1 } },
      });

      if (node.parentId) {
        await this.cascadeGroupCompletion(tx, userId, roadmapId, node.parentId, now, unlockedNodes);
      }
    } else if (node.nodeType === NodeType.MILESTONE) {
      await this.unlockNextGroupAfterMilestone(
        tx,
        userId,
        roadmapId,
        node.parentId,
        node.posY,
        now,
        unlockedNodes,
      );
    }

    return unlockedNodes;
  }

  async startLearning(userId: string, roadmapId: string): Promise<StartRoadmapResponse> {
    return this.prisma.$transaction(async (tx) => {
      await acquireUserRoadmapLock(tx, userId, roadmapId);

      const roadmap = await tx.roadmap.findFirst({
        select: ROADMAP_SELECT,
        where: getRoadmapAccessWhere(userId, roadmapId),
      });

      if (!roadmap) {
        throw new RoadmapNotFoundException(roadmapId);
      }

      const existingStartedProgress = await tx.userNodeProgress.findFirst({
        where: {
          userId,
          startedAt: { not: null },
          roadmapNode: { roadmapId: roadmap.id },
        },
        orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
        select: { startedAt: true },
      });

      if (existingStartedProgress?.startedAt) {
        return {
          roadmap: formatRoadmap(roadmap, existingStartedProgress.startedAt),
          unlockedNodes: [],
        };
      }

      const activeLearningRoadmaps = await this.countActiveLearningRoadmaps(tx, userId, roadmap.id);

      if (activeLearningRoadmaps >= MAX_ACTIVE_LEARNING_ROADMAPS) {
        throw new AppConflictException('Maximum number of active roadmaps exceeded.');
      }

      const now = new Date();
      const unlockedNodes: string[] = [];

      await this.ensureUserRoadmapProgressRows(tx, userId, roadmap.id);
      await this.unlockInitialRoadmapNodes(tx, userId, roadmap.id, now, unlockedNodes);

      return {
        roadmap: formatRoadmap(roadmap, now),
        unlockedNodes,
      };
    });
  }

  private async countActiveLearningRoadmaps(
    tx: RoadmapTransaction,
    userId: string,
    excludedRoadmapId: string,
  ): Promise<number> {
    return tx.roadmap.count({
      where: {
        id: { not: excludedRoadmapId },
        OR: [{ isTemplate: false, userId }, { isTemplate: true }],
        nodes: {
          some: {
            userNodeProgress: {
              some: {
                userId,
                startedAt: { not: null },
              },
            },
          },
        },
        NOT: {
          nodes: {
            every: {
              userNodeProgress: {
                some: {
                  userId,
                  status: NodeStatus.COMPLETED,
                },
              },
            },
          },
        },
      },
    });
  }

  async deleteTemplateProgress(userId: string, roadmapId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await acquireUserRoadmapLock(tx, userId, roadmapId);

      const template = await tx.roadmap.findFirst({
        where: {
          id: roadmapId,
          isTemplate: true,
        },
        select: { id: true },
      });

      if (!template) {
        throw new RoadmapNotFoundException(roadmapId);
      }

      const runningSubmission = await tx.milestoneSubmission.findFirst({
        where: {
          roadmapNode: { roadmapId },
          status: MilestoneSubmissionStatus.RUNNING,
          userId,
        },
        select: { id: true },
      });

      if (runningSubmission) {
        throw new AppConflictException(
          'Learning progress cannot be deleted while a milestone submission is running',
        );
      }

      await tx.userNodeProgress.deleteMany({
        where: {
          roadmapNode: { roadmapId },
          userId,
        },
      });
    });
  }

  private async cascadeGroupCompletion(
    tx: RoadmapTransaction,
    userId: string,
    roadmapId: string,
    groupId: string,
    now: Date,
    unlockedNodes: string[],
  ): Promise<void> {
    const requiredChildren = await tx.roadmapNode.findMany({
      where: { parentId: groupId, nodeType: NodeType.REQUIRED },
      select: { id: true },
    });

    if (requiredChildren.length === 0) return;

    const completedCount = await tx.userNodeProgress.count({
      where: {
        userId,
        roadmapNodeId: { in: requiredChildren.map((child) => child.id) },
        status: NodeStatus.COMPLETED,
      },
    });

    if (completedCount < requiredChildren.length) return;

    const group = await tx.roadmapNode.findFirst({
      where: { id: groupId },
      select: { parentId: true, posY: true },
    });

    if (!group) return;

    const groupProgress = await tx.userNodeProgress.findUnique({
      where: { userId_roadmapNodeId: { userId, roadmapNodeId: groupId } },
      select: { status: true },
    });

    if (groupProgress?.status === NodeStatus.COMPLETED) return;

    await this.unlockProgressNode(tx, userId, groupId, now, unlockedNodes);

    await tx.userNodeProgress.update({
      where: { userId_roadmapNodeId: { userId, roadmapNodeId: groupId } },
      data: { status: NodeStatus.COMPLETED, completedAt: now },
    });

    this.addUnlockedNode(unlockedNodes, groupId);
    await this.unlockGroupLeaves(tx, userId, groupId, now, unlockedNodes);

    const nextSiblings = await tx.roadmapNode.findMany({
      where: {
        roadmapId,
        parentId: group.parentId,
        posY: { gt: group.posY },
      },
      orderBy: [{ posY: 'asc' }, { id: 'asc' }],
      select: { id: true, nodeType: true, posY: true },
      take: 5,
    });

    const firstNext = nextSiblings[0];
    if (!firstNext) return;

    if (firstNext.nodeType === NodeType.MILESTONE) {
      await this.unlockProgressNode(tx, userId, firstNext.id, now, unlockedNodes);
    } else if (firstNext.nodeType === NodeType.GROUP) {
      await this.unlockGroup(tx, userId, firstNext.id, now, unlockedNodes);
    }
  }

  private async unlockNextGroupAfterMilestone(
    tx: RoadmapTransaction,
    userId: string,
    roadmapId: string,
    milestoneParentId: string | null,
    milestonePosY: Prisma.Decimal | number,
    now: Date,
    unlockedNodes: string[],
  ): Promise<void> {
    const nextGroup = await tx.roadmapNode.findFirst({
      where: {
        roadmapId,
        parentId: milestoneParentId,
        nodeType: NodeType.GROUP,
        posY: { gt: milestonePosY },
      },
      orderBy: [{ posY: 'asc' }, { id: 'asc' }],
      select: { id: true },
    });

    if (!nextGroup) return;

    await this.unlockGroup(tx, userId, nextGroup.id, now, unlockedNodes);
  }

  private async unlockGroup(
    tx: RoadmapTransaction,
    userId: string,
    groupId: string,
    now: Date,
    unlockedNodes: string[],
  ): Promise<void> {
    await this.unlockProgressNode(tx, userId, groupId, now, unlockedNodes);
    await this.unlockGroupLeaves(tx, userId, groupId, now, unlockedNodes);
  }

  private async unlockProgressNode(
    tx: RoadmapTransaction,
    userId: string,
    roadmapNodeId: string,
    now: Date,
    unlockedNodes: string[],
  ): Promise<void> {
    const result = await tx.userNodeProgress.updateMany({
      where: { userId, roadmapNodeId, status: NodeStatus.LOCKED },
      data: { status: NodeStatus.IN_PROGRESS, startedAt: now },
    });

    if (result.count > 0) {
      this.addUnlockedNode(unlockedNodes, roadmapNodeId);
    }
  }

  private async unlockGroupLeaves(
    tx: RoadmapTransaction,
    userId: string,
    groupId: string,
    now: Date,
    unlockedNodes: string[],
  ): Promise<void> {
    const lockedProgress = await tx.userNodeProgress.findMany({
      where: {
        userId,
        status: NodeStatus.LOCKED,
        roadmapNode: { parentId: groupId, nodeType: { in: LEAF_NODE_TYPES } },
      },
      select: { roadmapNodeId: true },
    });

    if (lockedProgress.length === 0) return;

    const leafIds = lockedProgress.map((progress) => progress.roadmapNodeId);

    await tx.userNodeProgress.updateMany({
      where: { userId, roadmapNodeId: { in: leafIds } },
      data: { status: NodeStatus.IN_PROGRESS, startedAt: now },
    });

    for (const leafId of leafIds) {
      this.addUnlockedNode(unlockedNodes, leafId);
    }
  }

  private addUnlockedNode(unlockedNodes: string[], nodeId: string): void {
    if (!unlockedNodes.includes(nodeId)) {
      unlockedNodes.push(nodeId);
    }
  }

  private async unlockInitialRoadmapNodes(
    tx: RoadmapTransaction,
    userId: string,
    roadmapId: string,
    now: Date,
    unlockedNodes: string[],
  ): Promise<void> {
    const firstGroup = await tx.roadmapNode.findFirst({
      where: { roadmapId, nodeType: NodeType.GROUP },
      orderBy: [{ posY: 'asc' }, { id: 'asc' }],
      select: { id: true },
    });

    if (firstGroup) {
      await this.unlockProgressNode(tx, userId, firstGroup.id, now, unlockedNodes);
      await this.unlockGroupLeaves(tx, userId, firstGroup.id, now, unlockedNodes);
      return;
    }

    const firstLeaf = await tx.roadmapNode.findFirst({
      where: { roadmapId, nodeType: { in: LEAF_NODE_TYPES } },
      orderBy: [{ posY: 'asc' }, { id: 'asc' }],
      select: { id: true },
    });

    if (firstLeaf) {
      await this.unlockProgressNode(tx, userId, firstLeaf.id, now, unlockedNodes);
    }
  }

  private async ensureUserRoadmapProgressRows(
    tx: RoadmapTransaction,
    userId: string,
    roadmapId: string,
  ): Promise<void> {
    const nodes = await tx.roadmapNode.findMany({
      where: { roadmapId },
      select: { id: true },
    });

    if (nodes.length === 0) {
      return;
    }

    await tx.userNodeProgress.createMany({
      data: nodes.map((node) => ({
        userId,
        roadmapNodeId: node.id,
        status: NodeStatus.LOCKED,
      })),
      skipDuplicates: true,
    });
  }
}
