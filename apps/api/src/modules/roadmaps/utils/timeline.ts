import { NodeStatus } from '@repo/db/prisma/client';

import {
  calculateDeadlineTimelineWarning,
  calculateTimelineWarning,
} from '@/common/utils/timeline-warning.util';

import type { DailyActivityRecord, RoadmapProgressNodeRecord } from './roadmap-records';

import { toUtcDateKey, toUtcMidnightMs } from './date';
import { roundToOne } from './number';

export { calculateDeadlineTimelineWarning, calculateTimelineWarning };

export const isNodeCompleted = (node: RoadmapProgressNodeRecord): boolean =>
  node.userNodeProgress[0]?.status === NodeStatus.COMPLETED;

export const calculatePercent = (completed: number, total: number): number => {
  if (total === 0) {
    return 0;
  }

  return roundToOne((completed / total) * 100);
};

export const calculateRoadmapStreakDays = (
  dailyActivities: DailyActivityRecord[],
  now = new Date(),
): number => {
  const activeDateKeys = new Set(
    dailyActivities
      .filter((activity) => activity.nodesCompleted > 0)
      .map((activity) => toUtcDateKey(activity.activityDate)),
  );
  const todayKey = toUtcDateKey(now);
  const startDate = new Date(toUtcMidnightMs(now));

  if (!activeDateKeys.has(todayKey)) {
    startDate.setUTCDate(startDate.getUTCDate() - 1);
  }

  let streakDays = 0;
  const cursor = new Date(startDate);

  while (activeDateKeys.has(toUtcDateKey(cursor))) {
    streakDays += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streakDays;
};

export const calculateEstimatedWeeks = (
  totalEstimatedHours: number,
  hoursPerDay: number,
): number | null => {
  if (totalEstimatedHours <= 0 || hoursPerDay <= 0) {
    return null;
  }

  return Math.max(1, Math.ceil(totalEstimatedHours / (hoursPerDay * 7)));
};
