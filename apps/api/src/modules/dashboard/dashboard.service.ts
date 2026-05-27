import { BadRequestException, Injectable } from '@nestjs/common';
import { NodeStatus, NodeType, type Prisma, type UserRole } from '@repo/db/prisma/client';

import type { TimelineWarningResponse } from '@/modules/roadmaps/types/roadmap-progress.types';

import { UserNotFoundException } from '@/common/exceptions/app.exceptions';
import {
  calculateLongestStreakDays,
  calculateStreakDays,
  fillDailyActivityRange,
  subtractUtcDays,
  toUtcMidnightDate,
} from '@/common/utils/streak-days.util';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { ActivityQueryDto } from './dto/activity-query.dto';
import type {
  ActivitySummaryResponse,
  DailyActivityEntryResponse,
  DashboardResponse,
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
    status: NodeStatus;
  }>;
};

type DashboardRoadmapRecord = {
  id: string;
  generatedAt: Date;
  hoursPerDay: Prisma.Decimal | number | null;
  nodes: DashboardRoadmapNodeRecord[];
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
        roadmaps: {
          where: { isTemplate: false },
          orderBy: [{ generatedAt: 'desc' }, { id: 'asc' }],
          take: 1,
          select: {
            id: true,
            generatedAt: true,
            hoursPerDay: true,
            nodes: {
              select: {
                id: true,
                nodeType: true,
                estimatedHours: true,
                userNodeProgress: {
                  where: { userId },
                  select: { status: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const streakDays = calculateStreakDays(user.dailyActivity);
    const activeRoadmap = user.roadmaps[0]
      ? this.formatRoadmapProgressSummary(user.roadmaps[0], streakDays)
      : null;

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: this.formatRole(user.role),
        createdAt: user.createdAt.toISOString(),
      },
      activeRoadmap,
      streakDays,
      activityRecent: this.formatRecentActivity(user.dailyActivity),
    };
  }

  private formatRoadmapProgressSummary(
    roadmap: DashboardRoadmapRecord,
    streakDays: number,
  ): DashboardResponse['activeRoadmap'] {
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

    return {
      roadmapId: roadmap.id,
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

  private formatRecentActivity(
    dailyActivities: DailyActivityRecord[],
    now = new Date(),
  ): DailyActivityEntryResponse[] {
    const to = toUtcMidnightDate(now);
    const from = subtractUtcDays(to, DASHBOARD_ACTIVITY_DAYS - 1);

    return fillDailyActivityRange(dailyActivities, from, to);
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
        Math.floor((this.toUtcMidnightMs(now) - this.toUtcMidnightMs(generatedAt)) / MS_PER_DAY) +
          1,
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

  private toUtcMidnightMs(date: Date): number {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }

  private formatRole(role: UserRole): string {
    return role.toLowerCase();
  }
}
