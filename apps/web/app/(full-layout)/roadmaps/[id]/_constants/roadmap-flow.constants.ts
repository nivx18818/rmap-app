import type { NodeType, ProgressStatus } from '../_types/roadmap-node.types';

export const ROADMAP_TITLE_NODE_ID = 'roadmap-title-node';

export const ROADMAP_FLOW_NODE_SIZES = {
  node: { height: 45, width: 260 },
  title: { height: 60, width: 360 },
} as const;

export const TITLE_NODE_GAP = 150;

const sharedStatusClasses = {
  COMPLETED: 'border-border-node bg-background-node-completed text-foreground',
  IN_PROGRESS: 'border-border-node bg-background-node-in-progress text-foreground',
} as const;

export const groupStatusClasses = {
  ...sharedStatusClasses,
  LOCKED: 'border-border-node bg-background-group-node-locked text-foreground',
} as const;

export const milestoneStatusClasses = {
  COMPLETED: sharedStatusClasses.COMPLETED,
  IN_PROGRESS: 'border-chart-4 bg-chart-4/20 text-foreground',
  LOCKED: 'border-zinc-300 bg-zinc-100 text-zinc-700',
} as const;

export const skillTypeStatusClasses = {
  OPTIONAL: {
    ...sharedStatusClasses,
    LOCKED: 'border-border-node bg-background-optional-node-locked text-foreground',
  },
  REQUIRED: {
    ...sharedStatusClasses,
    LOCKED: 'border-border-node bg-background-require-node-locked text-foreground',
  },
} as const;

export const skillMarkerClasses: Record<Extract<NodeType, 'OPTIONAL' | 'REQUIRED'>, string> = {
  OPTIONAL: 'text-skillmarker-optional',
  REQUIRED: 'text-skillmarker-required',
};

export const milestoneMarkerClasses: Record<ProgressStatus, string> = {
  COMPLETED: 'bg-yellow-500 text-primary-foreground',
  IN_PROGRESS: 'bg-yellow-500 text-primary-foreground',
  LOCKED: 'bg-zinc-700 text-primary-foreground',
};

export const nodeNameStatusClasses = {
  COMPLETED: 'line-through decoration-2 underline-offset-2',
  IN_PROGRESS: 'underline',
  LOCKED: 'no-underline',
} as const;
