export interface StreakActivityRecord {
  activityDate: Date;
  nodesCompleted: number;
}

export interface FilledDailyActivityEntry {
  activityDate: string;
  nodesCompleted: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const toUtcDateKey = (date: Date): string => date.toISOString().slice(0, 10);

const toUtcMidnightMs = (date: Date): number =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

export const calculateStreakDays = (
  dailyActivities: StreakActivityRecord[],
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

export const calculateLongestStreakDays = (dailyActivities: StreakActivityRecord[]): number => {
  const activeDates = Array.from(
    new Set(
      dailyActivities
        .filter((activity) => activity.nodesCompleted > 0)
        .map((activity) => toUtcDateKey(activity.activityDate)),
    ),
  ).sort();

  let longestStreak = 0;
  let currentStreak = 0;
  let previousDateMs: number | null = null;

  activeDates.forEach((dateKey) => {
    const currentDateMs = Date.parse(`${dateKey}T00:00:00.000Z`);

    currentStreak =
      previousDateMs !== null && currentDateMs - previousDateMs === MS_PER_DAY
        ? currentStreak + 1
        : 1;
    longestStreak = Math.max(longestStreak, currentStreak);
    previousDateMs = currentDateMs;
  });

  return longestStreak;
};

export const fillDailyActivityRange = (
  dailyActivities: StreakActivityRecord[],
  from: Date,
  to: Date,
): FilledDailyActivityEntry[] => {
  const nodesCompletedByDate = new Map(
    dailyActivities.map((activity) => [
      toUtcDateKey(activity.activityDate),
      activity.nodesCompleted,
    ]),
  );
  const fromMidnightMs = toUtcMidnightMs(from);
  const toMidnightMs = toUtcMidnightMs(to);
  const days = Math.floor((toMidnightMs - fromMidnightMs) / MS_PER_DAY) + 1;

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(fromMidnightMs + index * MS_PER_DAY);
    const activityDate = toUtcDateKey(date);

    return {
      activityDate,
      nodesCompleted: nodesCompletedByDate.get(activityDate) ?? 0,
    };
  });
};

export const subtractUtcDays = (date: Date, days: number): Date =>
  new Date(toUtcMidnightMs(date) - days * MS_PER_DAY);

export const toUtcMidnightDate = (date: Date): Date => new Date(toUtcMidnightMs(date));
