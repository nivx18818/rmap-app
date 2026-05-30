import { BadRequestException, Injectable } from '@nestjs/common';
import {
  NodeStatus,
  NodeType,
  type Prisma,
  type RoleCategory,
  type UserRole,
} from '@repo/db/prisma/client';

import type { RoadmapResponseDto } from '@/modules/roadmaps/dto/roadmap-response.dto';
import type { TimelineWarningResponse } from '@/modules/roadmaps/types/roadmap-progress.types';

import { UserNotFoundException } from '@/common/exceptions/app.exceptions';
import {
  calculateLongestStreakDays,
  calculateStreakDays,
  fillDailyActivityRange,
  subtractUtcDays,
  toUtcMidnightDate,
  toUtcMidnightMs,
} from '@/common/utils/streak-days.util';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { ActivityQueryDto } from './dto/activity-query.dto';
import type {
  ActivitySummaryResponse,
  DailyActivityEntryResponse,
  DashboardActiveRoadmapResponse,
  DashboardResponse,
  DashboardRoadmapStatusResponse,
  DashboardSkillCategoryResponse,
  DashboardSummaryResponse,
} from './types/dashboard-response.types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const PACE_WARNING_THRESHOLD_PCT = 15;
const DASHBOARD_ACTIVITY_DAYS = 30;

type DailyActivityRecord = {
  activityDate: Date;
  nodesCompleted: number;
};

type DashboardRoadmapNodeRecord = {
  id: string;
  nodeType: NodeType;
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
    const [activeRoadmaps, userRoadmaps] = await this.prisma.$transaction([
      this.prisma.roadmap.findMany({
        where: {
          OR: [{ isTemplate: true }, { isTemplate: false, userId }],
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
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: this.getDashboardRoadmapSelect(userId),
      }),
      this.prisma.roadmap.findMany({
        where: { isTemplate: false, userId },
        orderBy: [{ generatedAt: 'desc' }, { id: 'asc' }],
        select: this.getDashboardRoadmapSelect(userId),
      }),
    ]);
    const activeRoadmapSummaries = activeRoadmaps.map((roadmap) =>
      this.formatRoadmapProgressSummary(roadmap, streakDays),
    );

    return {
      userProfile: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: this.formatRole(user.role),
        createdAt: user.createdAt.toISOString(),
      },
      activeRoadmaps: activeRoadmapSummaries,
      userRoadmaps: userRoadmaps.map((roadmap) => this.formatUserRoadmap(roadmap)),
      streakDays: streakDays,
      activityRecent: this.formatActivityRange(user.dailyActivity, DASHBOARD_ACTIVITY_DAYS),
      summary: this.formatSummary(userRoadmaps, activeRoadmapSummaries, streakDays),
      skillCategories: this.formatSkillCategories(userRoadmaps),
      roadmapStatus: this.formatRoadmapStatus(userRoadmaps, activeRoadmapSummaries),
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
          estimatedHours: true,
          userNodeProgress: {
            where: { userId },
            select: { status: true, startedAt: true },
          },
        },
      },
    } satisfies Prisma.RoadmapSelect;
  }

  private formatRoadmapProgressSummary(
    roadmap: DashboardRoadmapRecord,
    streakDays: number,
  ): DashboardActiveRoadmapResponse {
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

    return {
      deadlineDate: roadmapMetadata.deadlineDate,
      estimatedWeeks: roadmapMetadata.estimatedWeeks,
      goalName: roadmapMetadata.goalName,
      isTemplate: roadmapMetadata.isTemplate,
      roleCategory: roadmapMetadata.roleCategory,
      roadmapId: roadmap.id,
      startedAt: roadmapMetadata.startedAt,
      title: roadmapMetadata.title,
      completionPct: this.calculatePercent(nodesCompleted, nodesTotal),
      streakDays,
      skillReadinessPct: this.calculatePercent(
        requiredLeafNodesCompleted,
        requiredLeafNodes.length,
      ),
      nodesTotal,
      nodesCompleted,
      timelineWarning: this.calculateTimelineWarning(
        roadmap.generatedAt,
        toNumberOrNull(roadmap.hoursPerDay),
        completedHours,
      ),
    };
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
    userRoadmaps: DashboardRoadmapRecord[],
    activeRoadmapSummaries: DashboardActiveRoadmapResponse[],
    streakDays: number,
  ): DashboardSummaryResponse {
    const totalSkills = userRoadmaps.reduce(
      (total, roadmap) => total + this.getLeafNodes(roadmap).length,
      0,
    );
    const completedSkills = userRoadmaps.reduce(
      (total, roadmap) =>
        total + this.getLeafNodes(roadmap).filter((node) => this.isNodeCompleted(node)).length,
      0,
    );
    const inProgressSkills = userRoadmaps.reduce(
      (total, roadmap) =>
        total +
        this.getLeafNodes(roadmap).filter(
          (node) => node.userNodeProgress[0]?.status === NodeStatus.IN_PROGRESS,
        ).length,
      0,
    );

    return {
      totalRoadmaps: userRoadmaps.length,
      activeRoadmaps: activeRoadmapSummaries.length,
      completedRoadmaps: userRoadmaps.filter((roadmap) => this.isRoadmapCompleted(roadmap)).length,
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
      const currentCount = totals.get(roadmap.roleCategory) ?? 0;

      totals.set(roadmap.roleCategory, currentCount + this.getLeafNodes(roadmap).length);

      return totals;
    }, new Map<RoleCategory, number>());

    return Array.from(categoryTotals.entries())
      .map(([category, totalSkills]) => ({
        category,
        label: this.formatRoleCategory(category),
        totalSkills,
      }))
      .sort(
        (first, second) =>
          second.totalSkills - first.totalSkills || first.label.localeCompare(second.label),
      );
  }

  private formatRoadmapStatus(
    userRoadmaps: DashboardRoadmapRecord[],
    activeRoadmapSummaries: DashboardActiveRoadmapResponse[],
  ): DashboardRoadmapStatusResponse {
    const completedRoadmapIds = new Set(
      userRoadmaps
        .filter((roadmap) => this.isRoadmapCompleted(roadmap))
        .map((roadmap) => roadmap.id),
    );
    const behindPace = activeRoadmapSummaries.filter(
      (roadmap) => !completedRoadmapIds.has(roadmap.roadmapId) && roadmap.timelineWarning?.isBehind,
    ).length;
    const onTrack = activeRoadmapSummaries.filter(
      (roadmap) =>
        !completedRoadmapIds.has(roadmap.roadmapId) && !roadmap.timelineWarning?.isBehind,
    ).length;

    return {
      behindPace,
      onTrack,
      completed: completedRoadmapIds.size,
      notStarted: userRoadmaps.filter((roadmap) => this.getStartedAt(roadmap) === null).length,
    };
  }

  private getLeafNodes(roadmap: DashboardRoadmapRecord): DashboardRoadmapNodeRecord[] {
    return roadmap.nodes.filter(
      (node) => node.nodeType === NodeType.REQUIRED || node.nodeType === NodeType.OPTIONAL,
    );
  }

  private getStartedAt(roadmap: DashboardRoadmapRecord): Date | null {
    return (
      roadmap.nodes
        .flatMap((node) => node.userNodeProgress)
        .map((progress) => progress.startedAt)
        .filter((startedAt): startedAt is Date => startedAt !== null)
        .sort((a, b) => a.getTime() - b.getTime())[0] ?? null
    );
  }

  private isRoadmapCompleted(roadmap: DashboardRoadmapRecord): boolean {
    return roadmap.nodes.length > 0 && roadmap.nodes.every((node) => this.isNodeCompleted(node));
  }

  private calculateTimelineWarning(
    generatedAt: Date,
    hoursPerDay: number | null,
    completedHours: number,
    now = new Date(),
  ): TimelineWarningResponse | null {
    if (!hoursPerDay || hoursPerDay <= 0 || Number.isNaN(generatedAt.getTime())) {
      return null;
    }

    const daysElapsed =
      Math.max(
        1,
        Math.floor((toUtcMidnightMs(now) - toUtcMidnightMs(generatedAt)) / MS_PER_DAY) + 1,
      ) || 1;
    const plannedHoursElapsed = daysElapsed * hoursPerDay;

    if (plannedHoursElapsed <= 0) {
      return null;
    }

    const hoursDeficit = Math.max(0, plannedHoursElapsed - completedHours);
    const paceDeficitPct = this.roundToOne((hoursDeficit / plannedHoursElapsed) * 100);

    if (paceDeficitPct < PACE_WARNING_THRESHOLD_PCT) {
      return null;
    }

    const estimatedDelayDays = Math.ceil(hoursDeficit / hoursPerDay);

    return {
      isBehind: true,
      paceDeficitPct,
      estimatedDelayDays,
      message:
        `You are ${paceDeficitPct}% behind pace - projected delay is about ` +
        `${estimatedDelayDays} day(s).`,
    };
  }

  private isNodeCompleted(node: DashboardRoadmapNodeRecord): boolean {
    return node.userNodeProgress[0]?.status === NodeStatus.COMPLETED;
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
      throw new BadRequestException('Invalid activity date range');
    }

    return { from, to };
  }

  private parseDateOnly(value: string): Date {
    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new BadRequestException('Invalid activity date');
    }

    return date;
  }

  private formatRole(role: UserRole): string {
    return role.toLowerCase();
  }
}
