import type { RoadmapDisplayMode } from '../_types/roadmap-display-mode.types';
import type { NodeType, ProgressStatus } from '../_types/roadmap-node.types';

export const ROADMAP_DISPLAY_MODE_STORAGE_KEY = 'rmap-roadmap-display-mode';
export const SEARCH_DEBOUNCE_MS = 1000;

export const STATUS_FILTER_OPTIONS: Array<ProgressStatus | 'ALL'> = [
  'ALL',
  'LOCKED',
  'IN_PROGRESS',
  'COMPLETED',
];

export const NODE_TYPE_FILTER_OPTIONS: Array<NodeType | 'ALL'> = [
  'ALL',
  'GROUP',
  'MILESTONE',
  'REQUIRED',
  'OPTIONAL',
];

export const DISPLAY_MODE_OPTIONS: Array<{
  label: string;
  value: RoadmapDisplayMode;
}> = [
  { label: 'Stack List', value: 'stack-list' },
  { label: 'Skill Tree', value: 'skill-tree' },
];

export const ROADMAP_NODES_ERROR_MESSAGE = 'Unable to load this roadmap graph.';
