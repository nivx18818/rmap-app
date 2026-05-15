import type { NodeType, ProgressStatus } from '../_types/roadmap-node.types';

export const NODE_TYPE_LABELS = {
  GROUP: 'Group',
  MILESTONE: 'Milestone',
  OPTIONAL: 'Optional',
  REQUIRED: 'Required',
} as const satisfies Record<NodeType, string>;

export const STATUS_LABELS = {
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In progress',
  LOCKED: 'Locked',
} as const satisfies Record<ProgressStatus, string>;

export const NODE_TYPE_URL_VALUES = {
  GROUP: 'group',
  MILESTONE: 'milestone',
  OPTIONAL: 'optional',
  REQUIRED: 'required',
} as const satisfies Record<NodeType, string>;

export const STATUS_URL_VALUES = {
  COMPLETED: 'completed',
  IN_PROGRESS: 'in_progress',
  LOCKED: 'locked',
} as const satisfies Record<ProgressStatus, string>;

export const NODE_TYPE_BY_URL_VALUE = {
  group: 'GROUP',
  milestone: 'MILESTONE',
  optional: 'OPTIONAL',
  required: 'REQUIRED',
} as const satisfies Record<string, NodeType>;

export const STATUS_BY_URL_VALUE = {
  completed: 'COMPLETED',
  in_progress: 'IN_PROGRESS',
  locked: 'LOCKED',
} as const satisfies Record<string, ProgressStatus>;
