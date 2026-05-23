import { Injectable } from '@nestjs/common';
import { NodeStatus, NodeType, type Prisma, type UserRole } from '@repo/db/prisma/client';

import type { TimelineWarningResponse } from '@/modules/roadmaps/types/roadmap-progress.types';

import { UserNotFoundException } from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type {
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

    const streakDays = this.calculateStreakDays(user.dailyActivity);
    const activeRoadmap = user.roadmaps[0]
      ? this.formatRoadmapProgressSummary(user.roadmaps[0], streakDays)
      : null;

    return {
      user_profile: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: this.formatRole(user.role),
        createdAt: user.createdAt.toISOString(),
      },
      active_roadmap: activeRoadmap,
      streak_days: streakDays,
      activity_recent: this.formatRecentActivity(user.dailyActivity),
    };
  }

  private formatRoadmapProgressSummary(
    roadmap: DashboardRoadmapRecord,
    streakDays: number,
  ): DashboardResponse['active_roadmap'] {
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
    const nodesCompletedByDate = new Map(
      dailyActivities.map((activity) => [
        this.toUtcDateKey(activity.activityDate),
        activity.nodesCompleted,
      ]),
    );
    const todayMidnightMs = this.toUtcMidnightMs(now);

    return Array.from({ length: DASHBOARD_ACTIVITY_DAYS }, (_, index) => {
      const date = new Date(todayMidnightMs - (DASHBOARD_ACTIVITY_DAYS - 1 - index) * MS_PER_DAY);
      const dateKey = this.toUtcDateKey(date);

      return {
        activity_date: dateKey,
        nodes_completed: nodesCompletedByDate.get(dateKey) ?? 0,
      };
    });
  }

  private calculateStreakDays(dailyActivities: DailyActivityRecord[], now = new Date()): number {
    const activeDateKeys = new Set(
      dailyActivities
        .filter((activity) => activity.nodesCompleted > 0)
        .map((activity) => this.toUtcDateKey(activity.activityDate)),
    );
    const todayKey = this.toUtcDateKey(now);
    const startDate = new Date(this.toUtcMidnightMs(now));

    if (!activeDateKeys.has(todayKey)) {
      startDate.setUTCDate(startDate.getUTCDate() - 1);
    }

    let streakDays = 0;
    const cursor = new Date(startDate);

    while (activeDateKeys.has(this.toUtcDateKey(cursor))) {
      streakDays += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return streakDays;
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

  private toUtcDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private toUtcMidnightMs(date: Date): number {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }

  private formatRole(role: UserRole): string {
    return role.toLowerCase();
  }
}
