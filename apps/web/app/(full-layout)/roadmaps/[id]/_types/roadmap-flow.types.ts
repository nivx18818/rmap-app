import type { Node, NodeTypes } from '@xyflow/react';

import type { NodeType, ProgressStatus, RoadmapNode } from './roadmap-node.types';

export type RoadmapFlowNodeKind = 'roadmapTitle' | 'roadmapGroup' | 'milestone' | 'skill';

export interface RoadmapFlowNodeData extends Record<string, unknown> {
  markerSide?: 'left' | 'right';
  matchState?: 'dimmed' | 'matched' | 'normal';
  node?: RoadmapNode;
  searchMatched?: boolean;
  searchQuery?: string;
  title?: string;
  visualStatus?: ProgressStatus;
}

export type RoadmapFlowNode = Node<RoadmapFlowNodeData, RoadmapFlowNodeKind>;

export type RoadmapNodeTypes = NodeTypes;

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  GROUP: 'Group',
  MILESTONE: 'Milestone',
  OPTIONAL: 'Optional',
  REQUIRED: 'Required',
};

export const STATUS_LABELS: Record<ProgressStatus, string> = {
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In progress',
  LOCKED: 'Locked',
};

export const NODE_TYPE_URL_VALUES: Record<NodeType, string> = {
  GROUP: 'group',
  MILESTONE: 'milestone',
  OPTIONAL: 'optional',
  REQUIRED: 'required',
};

export const STATUS_URL_VALUES: Record<ProgressStatus, string> = {
  COMPLETED: 'completed',
  IN_PROGRESS: 'in_progress',
  LOCKED: 'locked',
};
