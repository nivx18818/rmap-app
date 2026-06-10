import { toUtcMidnightMs } from './streak-days.util';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const PACE_WARNING_THRESHOLD_PCT = 15;
const FEASIBILITY_THRESHOLD = 0.15;

export interface TimelineWarningResponse {
  isBehind: boolean;
  paceDeficitPct: number;
  estimatedDelayDays: number;
  message: string;
}

function roundToOne(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateTimelineWarning(
  generatedAt: Date,
  hoursPerDay: number | null,
  completedHours: number,
  now = new Date(),
): TimelineWarningResponse | null {
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
}

export function calculateDeadlineTimelineWarning(
  deadline: Date,
  hoursPerDay: number,
  totalEstimatedHours: number,
  now = new Date(),
  messageSubject = 'The generated roadmap estimate',
): TimelineWarningResponse | null {
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
}
