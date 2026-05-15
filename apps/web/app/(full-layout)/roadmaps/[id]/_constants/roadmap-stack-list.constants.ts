import type { ProgressStatus } from '../_types/roadmap-node.types';

export const statusBadgeClasses: Record<ProgressStatus, string> = {
  COMPLETED: 'border-chart-2 bg-chart-2/10 text-foreground',
  IN_PROGRESS: 'border-primary/50 bg-primary/10 text-primary',
  LOCKED: 'border-zinc-300 bg-zinc-100 text-zinc-700',
};

export const sectionClasses = {
  group: 'border-primary/20 bg-background shadow-sm',
  milestone: {
    LOCKED: 'border-zinc-300 bg-zinc-100 text-zinc-700',
    IN_PROGRESS: 'border-primary/20 bg-background shadow-sm',
    COMPLETED: 'border-yellow-300 bg-yellow-50 shadow-sm',
  },
  orphan: 'border-border bg-background shadow-sm',
} as const;

export const mileStoneIconClasses: Record<ProgressStatus, string> = {
  COMPLETED: 'bg-yellow-500 text-primary-foreground',
  IN_PROGRESS: 'bg-primary text-primary-foreground',
  LOCKED: 'bg-zinc-700 text-primary-foreground',
};

export const milestoneTypeBadgeClasses: Record<ProgressStatus, string> = {
  COMPLETED: 'border-yellow-500 bg-yellow-500/10 text-yellow-950',
  IN_PROGRESS: 'border-secondary bg-secondary/10 text-secondary-900',
  LOCKED: 'border-zinc-300 bg-zinc-300/10 text-zinc-700',
};
