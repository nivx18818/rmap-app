import type { Variants } from 'framer-motion';

export const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
      ease: [0.21, 0.47, 0.32, 0.98],
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');
export const PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function formatPercent(value: number): string {
  return `${PERCENT_FORMATTER.format(clampPercent(value))}%`;
}

export function formatDayCount(days: number): string {
  return `${NUMBER_FORMATTER.format(days)} ${days === 1 ? 'day' : 'days'}`;
}
