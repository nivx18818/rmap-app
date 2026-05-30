const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function formatPercent(value: number): string {
  return `${clampPercent(value)}%`;
}

export function formatDate(value: null | string | Date): string {
  if (!value) return 'No deadline';

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 'No deadline' : DATE_FORMATTER.format(date);
}

export function formatRoleCategory(value: string): string {
  if (!value) return '';
  return value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join('');
}
