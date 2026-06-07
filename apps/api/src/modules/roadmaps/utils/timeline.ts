import { NodeStatus } from '@repo/db/prisma/client';

import type { TimelineWarningResponse } from '../types/roadmap-progress.types';
import type { DailyActivityRecord, RoadmapProgressNodeRecord } from './roadmap-records';

import { toUtcDateKey, toUtcMidnightMs } from './date';
import { roundToOne } from './number';
import { FEASIBILITY_THRESHOLD, MS_PER_DAY, PACE_WARNING_THRESHOLD_PCT } from './roadmap.constants';

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

export const calculateDeadlineTimelineWarning = (
  deadline: Date,
  hoursPerDay: number,
  totalEstimatedHours: number,
  now = new Date(),
  messageSubject = 'The generated roadmap estimate',
): TimelineWarningResponse | null => {
  if (hoursPerDay <= 0 || totalEstimatedHours <= 0) {
    return null;
  }

  const daysUntilDeadline = Math.max(
    1,
    Math.ceil((deadline.getTime() - now.getTime()) / MS_PER_DAY),
  );
  const availableHours = daysUntilDeadline * hoursPerDay;

  if (totalEstimatedHours <= availableHours * (1 + FEASIBILITY_THRESHOLD)) {
    return null;
  }

  const hoursDeficit = totalEstimatedHours - availableHours;
  const paceDeficitPct = roundToOne((hoursDeficit / totalEstimatedHours) * 100);
  const estimatedDelayDays = Math.ceil(hoursDeficit / hoursPerDay);

  return {
    isBehind: true,
    paceDeficitPct,
    estimatedDelayDays,
    message:
      `${messageSubject} may not fit your deadline: about ` +
      `${estimatedDelayDays} additional study day(s) needed.`,
  };
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

export const calculateTimelineWarning = (
  generatedAt: Date,
  hoursPerDay: number | null,
  completedHours: number,
  now = new Date(),
): TimelineWarningResponse | null => {
  if (!hoursPerDay || hoursPerDay <= 0 || Number.isNaN(generatedAt.getTime())) {
    return null;
  }

  const daysElapsed = Math.floor(
    (toUtcMidnightMs(now) - toUtcMidnightMs(generatedAt)) / MS_PER_DAY,
  );

  if (daysElapsed <= 0) {
    return null;
  }

  const plannedHoursElapsed = daysElapsed * hoursPerDay;

  if (plannedHoursElapsed <= 0) {
    return null;
  }

  const hoursDeficit = Math.max(0, plannedHoursElapsed - completedHours);
  const paceDeficitPct = roundToOne((hoursDeficit / plannedHoursElapsed) * 100);

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
};
