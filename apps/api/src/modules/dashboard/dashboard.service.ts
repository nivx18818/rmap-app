import { Injectable } from '@nestjs/common';
import {
  NodeStatus,
  NodeType,
  type Prisma,
  type RoleCategory,
  type UserRole,
} from '@repo/db/prisma/client';

import type { RoadmapResponseDto } from '@/modules/roadmaps/dto/roadmap-response.dto';
import type { TimelineWarningResponse } from '@/modules/roadmaps/types/roadmap-progress.types';

import {
  ActivityDateInvalidException,
  ActivityDateRangeInvalidException,
  UserNotFoundException,
} from '@/common/exceptions/app.exceptions';
import {
  calculateLongestStreakDays,
  calculateStreakDays,
  fillDailyActivityRange,
  subtractUtcDays,
  toUtcMidnightDate,
} from '@/common/utils/streak-days.util';
import {
  calculateDeadlineTimelineWarning,
  calculateTimelineWarning,
} from '@/common/utils/timeline-warning.util';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { ActivityQueryDto } from './dto/activity-query.dto';
import type { DashboardSearchQueryDto } from './dto/dashboard-search-query.dto';
import type {
  DashboardHomePaceWarningResponse,
  DashboardHomeResponse,
  DashboardHomeRoadmapResponse,
} from './types/dashboard-home-response.types';
import type {
  ActivitySummaryResponse,
  DailyActivityEntryResponse,
  DashboardRoadmapResponse,
  DashboardResponse,
  DashboardRoadmapStatusResponse,
  DashboardSkillCategoryResponse,
  DashboardSummaryResponse,
} from './types/dashboard-response.types';
import type {
  DashboardSearchResponse,
  DashboardSearchRoadmapResponse,
  DashboardSearchSkillResponse,
} from './types/dashboard-search-response.types';

const DASHBOARD_ACTIVITY_DAYS = 30;
const DEFAULT_NODE_ESTIMATED_HOURS = 3;
const DASHBOARD_SEARCH_ROADMAPS_PER_PAGE = 5;
const DASHBOARD_SEARCH_SKILLS_PER_PAGE = 10;

type DailyActivityRecord = {
  activityDate: Date;
  nodesCompleted: number;
};

type DashboardRoadmapNodeRecord = {
  id: string;
  nodeType: NodeType;
  skillId: string | null;
  estimatedHours: Prisma.Decimal | number | null;
  userNodeProgress: Array<{
    startedAt: Date | null;
    status: NodeStatus;
  }>;
};

type DashboardRoadmapRecord = {
  deadlineDate: Date | null;
  description: string | null;
  id: string;
  estimatedWeeks: number | null;
  generatedAt: Date;
  goalName: string | null;
  hoursPerDay: Prisma.Decimal | number | null;
  isTemplate: boolean;
  nodes: DashboardRoadmapNodeRecord[];
  roleCategory: RoleCategory;
  title: string;
  updatedAt: Date;
  userId: string | null;
};

type DashboardHomeRoadmapNodeRecord = DashboardRoadmapNodeRecord & {
  description: string | null;
  name: string;
  parentId: string | null;
  posY: Prisma.Decimal | number;
};

type DashboardHomeRoadmapRecord = Omit<DashboardRoadmapRecord, 'nodes'> & {
  nodes: DashboardHomeRoadmapNodeRecord[];
};

type DashboardSearchRoadmapRecord = {
  description: string | null;
  estimatedWeeks: number | null;
  goalName: string | null;
  id: string;
  isTemplate: boolean;
  roleCategory: RoleCategory;
  title: string;
};

type DashboardSearchSkillRecord = {
  defaultEstimatedHours: Prisma.Decimal | number | null;
  description: string | null;
  id: string;
  name: string;
  roleCategory: RoleCategory | null;
};

const toNumberOrNull = (value: Prisma.Decimal | number | null) =>
  value === null ? null : Number(value);

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getActivitySummary(
    userId: string,
    query: ActivityQueryDto = {},
  ): Promise<ActivitySummaryResponse> {
    const { from, to } = this.resolveActivityRange(query);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        dailyActivity: {
          orderBy: [{ activityDate: 'desc' }, { id: 'asc' }],
          select: {
            activityDate: true,
            nodesCompleted: true,
          },
        },
      },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    return {
      streakDays: calculateStreakDays(user.dailyActivity),
      longestStreak: calculateLongestStreakDays(user.dailyActivity),
      activity: fillDailyActivityRange(user.dailyActivity, from, to),
    };
  }

  async getDashboard(userId: string): Promise<DashboardResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        avatarUrl: true,
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        dailyActivity: {
          orderBy: [{ activityDate: 'desc' }, { id: 'asc' }],
          select: {
            activityDate: true,
            nodesCompleted: true,
          },
        },
      },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const streakDays = calculateStreakDays(user.dailyActivity);
    const rawRoadmaps = await this.findDashboardRoadmaps(userId);

    const roadmaps = rawRoadmaps.map((roadmap) => this.formatRoadmapSummary(roadmap, streakDays));

    return {
      userProfile: {
        avatarUrl: user.avatarUrl,
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: this.formatRole(user.role),
        createdAt: user.createdAt.toISOString(),
      },
      roadmaps,
      streakDays: streakDays,
      activityRecent: this.formatActivityRange(user.dailyActivity, DASHBOARD_ACTIVITY_DAYS),
      summary: this.formatSummary(rawRoadmaps, roadmaps, streakDays),
      skillCategories: this.formatSkillCategories(rawRoadmaps),
      roadmapStatus: this.formatRoadmapStatus(rawRoadmaps, roadmaps),
    };
  }

  async getHome(userId: string): Promise<DashboardHomeResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        dailyActivity: {
          orderBy: [{ activityDate: 'desc' }, { id: 'asc' }],
          select: {
            activityDate: true,
            nodesCompleted: true,
          },
        },
      },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const streakDays = calculateStreakDays(user.dailyActivity);
    const activeRoadmaps = (await this.findHomeRoadmaps(userId)).filter(
      (roadmap) => this.getStartedAt(roadmap) !== null && !this.isRoadmapCompleted(roadmap),
    );

    return {
      activeRoadmaps: activeRoadmaps.map((roadmap) => this.formatHomeRoadmap(roadmap)),
      metrics: this.formatHomeMetrics(activeRoadmaps, streakDays),
    };
  }

  async search(
    userId: string,
    query: DashboardSearchQueryDto = {},
  ): Promise<DashboardSearchResponse> {
    const searchQuery = (query.query ?? '').trim();
    const roadmapPage = query.roadmapPage ?? 1;
    const skillPage = query.skillPage ?? 1;

    if (searchQuery.length === 0) {
      return this.formatEmptySearchResponse(searchQuery, roadmapPage, skillPage);
    }

    const roadmapWhere = this.getDashboardSearchRoadmapWhere(userId, searchQuery);
    const skillWhere = this.getDashboardSearchSkillWhere(searchQuery);
    const [roadmaps, roadmapsTotal, skills, skillsTotal] = await this.prisma.$transaction([
      this.prisma.roadmap.findMany({
        orderBy: [{ isTemplate: 'desc' }, { updatedAt: 'desc' }, { id: 'asc' }],
        select: {
          description: true,
          estimatedWeeks: true,
          goalName: true,
          id: true,
          isTemplate: true,
          roleCategory: true,
          title: true,
        },
        skip: (roadmapPage - 1) * DASHBOARD_SEARCH_ROADMAPS_PER_PAGE,
        take: DASHBOARD_SEARCH_ROADMAPS_PER_PAGE,
        where: roadmapWhere,
      }),
      this.prisma.roadmap.count({ where: roadmapWhere }),
      this.prisma.skill.findMany({
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        select: {
          defaultEstimatedHours: true,
          description: true,
          id: true,
          name: true,
          roleCategory: true,
        },
        skip: (skillPage - 1) * DASHBOARD_SEARCH_SKILLS_PER_PAGE,
        take: DASHBOARD_SEARCH_SKILLS_PER_PAGE,
        where: skillWhere,
      }),
      this.prisma.skill.count({ where: skillWhere }),
    ]);

    return {
      query: searchQuery,
      roadmaps: {
        data: roadmaps.map((roadmap) => this.formatSearchRoadmap(roadmap)),
        meta: this.formatPaginationMeta(
          roadmapPage,
          DASHBOARD_SEARCH_ROADMAPS_PER_PAGE,
          roadmapsTotal,
        ),
      },
      skills: {
        data: skills.map((skill) => this.formatSearchSkill(skill)),
        meta: this.formatPaginationMeta(skillPage, DASHBOARD_SEARCH_SKILLS_PER_PAGE, skillsTotal),
      },
      meta: {
        totalResults: roadmapsTotal + skillsTotal,
        roadmapPageSize: DASHBOARD_SEARCH_ROADMAPS_PER_PAGE,
        skillPageSize: DASHBOARD_SEARCH_SKILLS_PER_PAGE,
      },
    };
  }

  private async findDashboardRoadmaps(userId: string): Promise<DashboardRoadmapRecord[]> {
    return this.prisma.roadmap.findMany({
      where: this.getUserRoadmapsWhere(userId),
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      select: this.getDashboardRoadmapSelect(userId),
    });
  }

  private async findHomeRoadmaps(userId: string): Promise<DashboardHomeRoadmapRecord[]> {
    return this.prisma.roadmap.findMany({
      where: this.getUserRoadmapsWhere(userId),
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      select: this.getHomeRoadmapSelect(userId),
    });
  }

  private getUserRoadmapsWhere(userId: string): Prisma.RoadmapWhereInput {
    return {
      OR: [
        { isTemplate: false, userId },
        {
          isTemplate: true,
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
        },
      ],
    };
  }

  private getDashboardRoadmapSelect(userId: string) {
    return {
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
      nodes: {
        select: {
          id: true,
          nodeType: true,
          skillId: true,
          estimatedHours: true,
          userNodeProgress: {
            where: { userId },
            select: { status: true, startedAt: true },
          },
        },
      },
    } satisfies Prisma.RoadmapSelect;
  }

  private getHomeRoadmapSelect(userId: string) {
    return {
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
      nodes: {
        select: {
          description: true,
          id: true,
          name: true,
          nodeType: true,
          parentId: true,
          skillId: true,
          estimatedHours: true,
          posY: true,
          userNodeProgress: {
            where: { userId },
            select: { status: true, startedAt: true },
          },
        },
      },
    } satisfies Prisma.RoadmapSelect;
  }

  private getDashboardSearchRoadmapWhere(userId: string, query: string): Prisma.RoadmapWhereInput {
    return {
      AND: [
        {
          OR: [
            { isTemplate: true },
            {
              isTemplate: false,
              userId,
            },
          ],
        },
        {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { goalName: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      ],
    };
  }

  private getDashboardSearchSkillWhere(query: string): Prisma.SkillWhereInput {
    return {
      name: {
        contains: query,
        mode: 'insensitive',
      },
    };
  }

  private formatRoadmapSummary(
    roadmap: DashboardRoadmapRecord,
    streakDays: number,
  ): DashboardRoadmapResponse {
    const nodesTotal = roadmap.nodes.length;
    const completedNodes = roadmap.nodes.filter((node) => this.isNodeCompleted(node));
    const nodesCompleted = completedNodes.length;
    const requiredLeafNodes = roadmap.nodes.filter((node) => node.nodeType === NodeType.REQUIRED);
    const requiredLeafNodesCompleted = requiredLeafNodes.filter((node) =>
      this.isNodeCompleted(node),
    ).length;
    const completedHours = completedNodes.reduce(
      (total, node) => total + (toNumberOrNull(node.estimatedHours) ?? 0),
      0,
    );

    const roadmapMetadata = this.formatUserRoadmap(roadmap);
    const isStarted = roadmapMetadata.startedAt !== null;

    return {
      roadmapId: roadmap.id,
      deadlineDate: roadmapMetadata.deadlineDate,
      description: roadmapMetadata.description,
      estimatedWeeks: roadmapMetadata.estimatedWeeks,
      goalName: roadmapMetadata.goalName,
      isTemplate: roadmapMetadata.isTemplate,
      roleCategory: roadmapMetadata.roleCategory,
      startedAt: roadmapMetadata.startedAt,
      title: roadmapMetadata.title,
      completionPct: isStarted ? this.calculatePercent(nodesCompleted, nodesTotal) : 0,
      streakDays: isStarted ? streakDays : 0,
      skillReadinessPct: isStarted
        ? this.calculatePercent(requiredLeafNodesCompleted, requiredLeafNodes.length)
        : 0,
      nodesTotal,
      nodesCompleted: isStarted ? nodesCompleted : 0,
      timelineWarning: isStarted ? this.resolveTimelineWarning(roadmap, completedHours) : null,
    };
  }

  private formatHomeRoadmap(roadmap: DashboardHomeRoadmapRecord): DashboardHomeRoadmapResponse {
    const startedAt = this.getStartedAt(roadmap);
    const orderedProgressNodes = this.getOrderedChapterNodes(roadmap);
    const currentGroup = this.findCurrentGroup(roadmap);
    const planNode = currentGroup
      ? this.findPlanNodeInGroup(roadmap, currentGroup.id)
      : this.findPlanNodeInGroup(roadmap, null);
    const currentChapterIndex = currentGroup
      ? orderedProgressNodes.findIndex((node) => node.id === currentGroup.id) + 1
      : 0;
    const requiredNodes = roadmap.nodes.filter((node) => node.nodeType === NodeType.REQUIRED);
    const requiredNodesCompleted = requiredNodes.filter((node) =>
      this.isNodeCompleted(node),
    ).length;
    const completedHours = roadmap.nodes
      .filter((node) => this.isNodeCompleted(node))
      .reduce((total, node) => total + (toNumberOrNull(node.estimatedHours) ?? 0), 0);

    return {
      roadmapId: roadmap.id,
      title: roadmap.title,
      goalName: roadmap.goalName,
      isTemplate: roadmap.isTemplate,
      roleCategory: roadmap.roleCategory,
      startedAt: startedAt?.toISOString() ?? '',
      currentGroup: currentGroup ? { id: currentGroup.id, name: currentGroup.name } : null,
      planNode: planNode
        ? {
            id: planNode.id,
            name: planNode.name,
            description: planNode.description,
            nodeType: planNode.nodeType,
            estimatedHours: toNumberOrNull(planNode.estimatedHours) ?? DEFAULT_NODE_ESTIMATED_HOURS,
          }
        : null,
      chapter: {
        current: currentChapterIndex,
        total: orderedProgressNodes.length,
        label: `Chapter ${currentChapterIndex}/${orderedProgressNodes.length}`,
      },
      progress: {
        requiredNodesCompleted,
        requiredNodesTotal: requiredNodes.length,
        requiredCompletionPct: this.calculatePercent(requiredNodesCompleted, requiredNodes.length),
      },
      nextUnlock: this.findNextUnlockGroup(roadmap, currentGroup),
      paceWarning: this.formatHomePaceWarning(this.resolveTimelineWarning(roadmap, completedHours)),
    };
  }

  private formatHomeMetrics(
    activeRoadmaps: DashboardHomeRoadmapRecord[],
    streakDays: number,
  ): DashboardHomeResponse['metrics'] {
    const allNodes = activeRoadmaps.flatMap((roadmap) => roadmap.nodes);
    const completedNodes = allNodes.filter((node) => this.isNodeCompleted(node)).length;
    const requiredNodes = allNodes.filter((node) => node.nodeType === NodeType.REQUIRED);
    const requiredNodesCompleted = requiredNodes.filter((node) =>
      this.isNodeCompleted(node),
    ).length;

    return {
      roadmapCompletionPct: this.calculatePercent(completedNodes, allNodes.length),
      streakDays,
      readinessPct: this.calculatePercent(requiredNodesCompleted, requiredNodes.length),
    };
  }

  private formatHomePaceWarning(
    warning: TimelineWarningResponse | null,
  ): DashboardHomePaceWarningResponse | null {
    if (!warning) {
      return null;
    }

    return {
      ...warning,
      title: `You are ${warning.paceDeficitPct}% behind your target pace.`,
      message: 'Finish 1 skill node today to back the track.',
      actionLabel: 'Adjust plan',
    };
  }

  private formatEmptySearchResponse(
    query: string,
    roadmapPage: number,
    skillPage: number,
  ): DashboardSearchResponse {
    return {
      query,
      roadmaps: {
        data: [],
        meta: this.formatPaginationMeta(roadmapPage, DASHBOARD_SEARCH_ROADMAPS_PER_PAGE, 0),
      },
      skills: {
        data: [],
        meta: this.formatPaginationMeta(skillPage, DASHBOARD_SEARCH_SKILLS_PER_PAGE, 0),
      },
      meta: {
        totalResults: 0,
        roadmapPageSize: DASHBOARD_SEARCH_ROADMAPS_PER_PAGE,
        skillPageSize: DASHBOARD_SEARCH_SKILLS_PER_PAGE,
      },
    };
  }

  private formatSearchRoadmap(
    roadmap: DashboardSearchRoadmapRecord,
  ): DashboardSearchRoadmapResponse {
    return {
      roadmapId: roadmap.id,
      title: roadmap.title,
      description: roadmap.description,
      goalName: roadmap.goalName,
      isTemplate: roadmap.isTemplate,
      roadmapType: roadmap.isTemplate ? 'template' : 'ai',
      roleCategory: roadmap.roleCategory,
      categoryLabel: this.formatRoleCategory(roadmap.roleCategory),
      estimatedWeeks: roadmap.estimatedWeeks,
      durationLabel: this.formatDurationLabel(roadmap.estimatedWeeks),
    };
  }

  private formatSearchSkill(skill: DashboardSearchSkillRecord): DashboardSearchSkillResponse {
    return {
      skillId: skill.id,
      name: skill.name,
      description: skill.description,
      roleCategory: skill.roleCategory,
      categoryLabel: skill.roleCategory ? this.formatRoleCategory(skill.roleCategory) : null,
      defaultEstimatedHours: toNumberOrNull(skill.defaultEstimatedHours),
    };
  }

  private formatPaginationMeta(page: number, perPage: number, total: number) {
    return {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    };
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

  private getOrderedChapterNodes(
    roadmap: DashboardHomeRoadmapRecord,
  ): DashboardHomeRoadmapNodeRecord[] {
    return roadmap.nodes
      .filter((node) => node.nodeType === NodeType.GROUP || node.nodeType === NodeType.MILESTONE)
      .sort((first, second) => this.compareNodesByPosition(first, second));
  }

  private findCurrentGroup(
    roadmap: DashboardHomeRoadmapRecord,
  ): DashboardHomeRoadmapNodeRecord | null {
    const inProgressGroup = roadmap.nodes
      .filter(
        (node) =>
          node.nodeType === NodeType.GROUP &&
          node.userNodeProgress[0]?.status === NodeStatus.IN_PROGRESS,
      )
      .sort((first, second) => this.compareNodesByPosition(first, second))[0];

    if (inProgressGroup) {
      return inProgressGroup;
    }

    const inProgressLeaf = roadmap.nodes
      .filter(
        (node) =>
          (node.nodeType === NodeType.REQUIRED || node.nodeType === NodeType.OPTIONAL) &&
          node.userNodeProgress[0]?.status === NodeStatus.IN_PROGRESS,
      )
      .sort((first, second) => this.compareNodesByPosition(first, second))[0];

    return inProgressLeaf?.parentId
      ? (roadmap.nodes.find((node) => node.id === inProgressLeaf.parentId) ?? null)
      : null;
  }

  private findPlanNodeInGroup(
    roadmap: DashboardHomeRoadmapRecord,
    groupId: string | null,
  ): DashboardHomeRoadmapNodeRecord | null {
    const inProgressLeaves = roadmap.nodes
      .filter(
        (node) =>
          node.parentId === groupId &&
          (node.nodeType === NodeType.REQUIRED || node.nodeType === NodeType.OPTIONAL) &&
          node.userNodeProgress[0]?.status === NodeStatus.IN_PROGRESS,
      )
      .sort((first, second) => {
        if (first.nodeType !== second.nodeType) {
          return first.nodeType === NodeType.REQUIRED ? -1 : 1;
        }

        return this.compareNodesByPosition(first, second);
      });

    return inProgressLeaves[0] ?? null;
  }

  private findNextUnlockGroup(
    roadmap: DashboardHomeRoadmapRecord,
    currentGroup: DashboardHomeRoadmapNodeRecord | null,
  ): { id: string; name: string } | null {
    const lockedGroups = roadmap.nodes
      .filter(
        (node) =>
          node.nodeType === NodeType.GROUP &&
          node.userNodeProgress[0]?.status === NodeStatus.LOCKED &&
          (!currentGroup || Number(node.posY) > Number(currentGroup.posY)),
      )
      .sort((first, second) => this.compareNodesByPosition(first, second));
    const nextGroup = lockedGroups[0];

    return nextGroup ? { id: nextGroup.id, name: nextGroup.name } : null;
  }

  private formatUserRoadmap(roadmap: DashboardRoadmapRecord): RoadmapResponseDto {
    const startedAt = this.getStartedAt(roadmap);

    return {
      deadlineDate: this.formatDateOnly(roadmap.deadlineDate),
      description: roadmap.description,
      estimatedWeeks: roadmap.estimatedWeeks,
      generatedAt: roadmap.generatedAt.toISOString(),
      goalName: roadmap.goalName,
      hoursPerDay: toNumberOrNull(roadmap.hoursPerDay),
      id: roadmap.id,
      isTemplate: roadmap.isTemplate,
      roleCategory: roadmap.roleCategory,
      startedAt: startedAt?.toISOString() ?? null,
      title: roadmap.title,
      updatedAt: roadmap.updatedAt.toISOString(),
      userId: roadmap.userId,
    };
  }

  private formatActivityRange(
    dailyActivities: DailyActivityRecord[],
    dayCount: number,
    now = new Date(),
  ): DailyActivityEntryResponse[] {
    const to = toUtcMidnightDate(now);
    const from = subtractUtcDays(to, dayCount - 1);

    return fillDailyActivityRange(dailyActivities, from, to);
  }

  private formatSummary(
    rawRoadmaps: DashboardRoadmapRecord[],
    roadmaps: DashboardRoadmapResponse[],
    streakDays: number,
  ): DashboardSummaryResponse {
    const totalSkills = rawRoadmaps.reduce(
      (total, roadmap) => total + this.getLeafNodes(roadmap).length,
      0,
    );
    const completedSkills = rawRoadmaps.reduce(
      (total, roadmap) =>
        total + this.getLeafNodes(roadmap).filter((node) => this.isNodeCompleted(node)).length,
      0,
    );
    const inProgressSkills = rawRoadmaps.reduce(
      (total, roadmap) =>
        total +
        this.getLeafNodes(roadmap).filter(
          (node) => node.userNodeProgress[0]?.status === NodeStatus.IN_PROGRESS,
        ).length,
      0,
    );

    return {
      totalRoadmaps: roadmaps.length,
      activeRoadmaps: roadmaps.filter((r) => r.startedAt !== null).length,
      completedRoadmaps: rawRoadmaps.filter((roadmap) => this.isRoadmapCompleted(roadmap)).length,
      totalSkills,
      completedSkills,
      inProgressSkills,
      lockedSkills: Math.max(0, totalSkills - completedSkills - inProgressSkills),
      currentStreak: streakDays,
    };
  }

  private formatSkillCategories(
    userRoadmaps: DashboardRoadmapRecord[],
  ): DashboardSkillCategoryResponse[] {
    const categoryTotals = userRoadmaps.reduce((totals, roadmap) => {
      const currentCount = totals.get(roadmap.roleCategory) ?? {
        completedSkillIds: new Set<string>(),
        skillIds: new Set<string>(),
      };
      const leafNodes = this.getLeafNodes(roadmap);

      for (const node of leafNodes) {
        const skillIdentity = this.getNodeSkillIdentity(node);

        currentCount.skillIds.add(skillIdentity);

        if (this.isNodeCompleted(node)) {
          currentCount.completedSkillIds.add(skillIdentity);
        }
      }

      totals.set(roadmap.roleCategory, {
        completedSkillIds: currentCount.completedSkillIds,
        skillIds: currentCount.skillIds,
      });

      return totals;
    }, new Map<RoleCategory, { completedSkillIds: Set<string>; skillIds: Set<string> }>());

    return Array.from(categoryTotals.entries())
      .map(([category, totals]) => ({
        category,
        label: this.formatRoleCategory(category),
        completedSkills: totals.completedSkillIds.size,
        totalSkills: totals.skillIds.size,
      }))
      .sort(
        (first, second) =>
          second.totalSkills - first.totalSkills || first.label.localeCompare(second.label),
      );
  }

  private formatRoadmapStatus(
    rawRoadmaps: DashboardRoadmapRecord[],
    roadmaps: DashboardRoadmapResponse[],
  ): DashboardRoadmapStatusResponse {
    const completedRoadmapIds = new Set(
      rawRoadmaps
        .filter((roadmap) => this.isRoadmapCompleted(roadmap))
        .map((roadmap) => roadmap.id),
    );
    const behindPace = roadmaps.filter(
      (roadmap) => !completedRoadmapIds.has(roadmap.roadmapId) && roadmap.timelineWarning?.isBehind,
    ).length;
    const onTrack = roadmaps.filter(
      (roadmap) =>
        !completedRoadmapIds.has(roadmap.roadmapId) &&
        roadmap.startedAt !== null &&
        !roadmap.timelineWarning?.isBehind,
    ).length;

    return {
      behindPace,
      onTrack,
      completed: completedRoadmapIds.size,
      notStarted: roadmaps.filter((roadmap) => roadmap.startedAt === null).length,
    };
  }

  private getLeafNodes(roadmap: DashboardRoadmapRecord): DashboardRoadmapNodeRecord[] {
    return roadmap.nodes.filter(
      (node) => node.nodeType === NodeType.REQUIRED || node.nodeType === NodeType.OPTIONAL,
    );
  }

  private getNodeSkillIdentity(node: DashboardRoadmapNodeRecord): string {
    return node.skillId ?? `roadmap-node:${node.id}`;
  }

  private getStartedAt(roadmap: {
    nodes: Array<{
      userNodeProgress: Array<{
        startedAt: Date | null;
      }>;
    }>;
  }): Date | null {
    return (
      roadmap.nodes
        .flatMap((node) => node.userNodeProgress)
        .map((progress) => progress.startedAt)
        .filter((startedAt): startedAt is Date => startedAt !== null)
        .sort((a, b) => a.getTime() - b.getTime())[0] ?? null
    );
  }

  private isRoadmapCompleted(roadmap: {
    nodes: Array<{
      userNodeProgress: Array<{
        status: NodeStatus;
      }>;
    }>;
  }): boolean {
    return roadmap.nodes.length > 0 && roadmap.nodes.every((node) => this.isNodeCompleted(node));
  }

  private resolveTimelineWarning(
    roadmap: DashboardRoadmapRecord | DashboardHomeRoadmapRecord,
    completedHours: number,
  ): TimelineWarningResponse | null {
    const totalLeafEstimatedHours = roadmap.nodes
      .filter((node) => node.nodeType === NodeType.REQUIRED || node.nodeType === NodeType.OPTIONAL)
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

    return (
      deadlineTimelineWarning ??
      calculateTimelineWarning(roadmap.generatedAt, hoursPerDay, completedHours)
    );
  }

  private isNodeCompleted(node: {
    userNodeProgress: Array<{
      status: NodeStatus;
    }>;
  }): boolean {
    return node.userNodeProgress[0]?.status === NodeStatus.COMPLETED;
  }

  private compareNodesByPosition(
    first: DashboardHomeRoadmapNodeRecord,
    second: DashboardHomeRoadmapNodeRecord,
  ): number {
    return Number(first.posY) - Number(second.posY) || first.id.localeCompare(second.id);
  }

  private calculatePercent(completed: number, total: number): number {
    if (total === 0) {
      return 0;
    }

    return this.roundToOne((completed / total) * 100);
  }

  private roundToOne(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private formatDateOnly(date: Date | null): string | null {
    return date ? date.toISOString().slice(0, 10) : null;
  }

  private formatRoleCategory(value: RoleCategory): string {
    return value
      .split('_')
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
      .join(' ');
  }

  private resolveActivityRange(query: ActivityQueryDto): { from: Date; to: Date } {
    const to = query.to ? this.parseDateOnly(query.to) : toUtcMidnightDate(new Date());
    const from = query.from ? this.parseDateOnly(query.from) : subtractUtcDays(to, 29);

    if (from.getTime() > to.getTime()) {
      throw new ActivityDateRangeInvalidException();
    }

    return { from, to };
  }

  private parseDateOnly(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new ActivityDateInvalidException();
    }

    return date;
  }

  private formatRole(role: UserRole): string {
    return role.toLowerCase();
  }
}
