import type { Node, NodeTypes } from '@xyflow/react';

import type { ProgressStatus, RoadmapNode } from './roadmap-node.types';

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
