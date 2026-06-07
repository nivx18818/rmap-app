export const formatDateOnly = (date: Date | null): null | string =>
  date ? date.toISOString().slice(0, 10) : null;

export const toUtcDateKey = (date: Date): string => date.toISOString().slice(0, 10);

export const toUtcMidnightMs = (date: Date): number =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
