export interface StreakActivityRecord {
  activityDate: Date;
  nodesCompleted: number;
}

const toUtcDateKey = (date: Date): string => date.toISOString().slice(0, 10);

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
