import type {
  RoadmapFlowNode,
  RoadmapFlowNodeData,
  RoadmapFlowNodeKind,
} from '../_types/roadmap-flow.types';
import type { RoadmapNode } from '../_types/roadmap-node.types';

import {
  ROADMAP_FLOW_NODE_SIZES,
  ROADMAP_TITLE_NODE_ID,
} from '../_constants/roadmap-flow.constants';
import {
  compactAxisLayout,
  getRoadmapNodeSize,
  getTitleNodePosition,
} from './roadmap-flow-layout.utils';
import { getNodeStatus, isSkillNode } from './roadmap-node.utils';

interface BuildFlowNodesOptions {
  compactAxis?: boolean;
  hasActiveFilters?: boolean;
  matchedNodeIds?: Set<string>;
  searchQuery?: string;
}

export function getFlowNodeKind(node: RoadmapNode): RoadmapFlowNodeKind {
  if (node.nodeType === 'GROUP') return 'roadmapGroup';
  if (node.nodeType === 'MILESTONE') return 'milestone';
  return 'skill';
}

export function matchesSearchQuery(node: RoadmapNode, query?: string) {
  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery) return false;

  return `${node.name} ${node.description ?? ''}`.toLowerCase().includes(normalizedQuery);
}

export function buildTitleNode(
  roadmapNodes: RoadmapNode[],
  title: string,
  searchQuery?: string,
): RoadmapFlowNode[] {
  const titlePosition = getTitleNodePosition(roadmapNodes);

  if (!titlePosition) return [];

  return [
    {
      data: { searchQuery, title },
      draggable: false,
      id: ROADMAP_TITLE_NODE_ID,
      position: titlePosition,
      type: 'roadmapTitle',
      zIndex: 2,
    },
  ];
}

export function getMarkerSide(
  node: RoadmapNode,
  parent: RoadmapNode | null,
): RoadmapFlowNodeData['markerSide'] {
  if (!parent || !isSkillNode(node)) return undefined;

  const nodeCenterX = node.posX + ROADMAP_FLOW_NODE_SIZES.node.width / 2;
  const parentCenterX = parent.posX + getRoadmapNodeSize().width / 2;

  return nodeCenterX < parentCenterX ? 'left' : 'right';
}

export function getMatchState({
  hasActiveFilters,
  matchedNodeIds,
  nodeId,
}: {
  hasActiveFilters?: boolean;
  matchedNodeIds?: Set<string>;
  nodeId: string;
}): RoadmapFlowNodeData['matchState'] {
  if (!hasActiveFilters) return 'normal';
  return matchedNodeIds?.has(nodeId) ? 'matched' : 'dimmed';
}

export function buildFlowNodes(
  roadmapNodes: RoadmapNode[],
  title = 'Frontend Roadmap',
  options: BuildFlowNodesOptions = {},
): RoadmapFlowNode[] {
  const layoutNodes = options.compactAxis ? compactAxisLayout(roadmapNodes) : roadmapNodes;
  const nodeById = new Map(layoutNodes.map((node) => [node.id, node]));

  const titleNodes = buildTitleNode(layoutNodes, title, options.searchQuery);
  const contentNodes = layoutNodes.map((node) => {
    const parent = node.parentId ? (nodeById.get(node.parentId) ?? null) : null;

    return {
      data: {
        markerSide: getMarkerSide(node, parent),
        matchState: getMatchState({
          hasActiveFilters: options.hasActiveFilters,
          matchedNodeIds: options.matchedNodeIds,
          nodeId: node.id,
        }),
        node,
        searchMatched: matchesSearchQuery(node, options.searchQuery),
        searchQuery: options.searchQuery,
        visualStatus: getNodeStatus(node),
      },
      draggable: false,
      id: node.id,
      position: { x: node.posX, y: node.posY },
      type: getFlowNodeKind(node),
      zIndex: node.nodeType === 'GROUP' ? 0 : 1,
    };
  });

  return [...titleNodes, ...contentNodes];
}
