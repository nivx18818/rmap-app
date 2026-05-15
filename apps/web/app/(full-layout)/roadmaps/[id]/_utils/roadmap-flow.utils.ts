import type { Edge } from '@xyflow/react';

import type {
  RoadmapFlowNode,
  RoadmapFlowNodeData,
  RoadmapFlowNodeKind,
} from '../_types/roadmap-flow.types';
import type { RoadmapNode } from '../_types/roadmap-node.types';

import {
  ROADMAP_FLOW_NODE_SIZES,
  ROADMAP_TITLE_NODE_ID,
  TITLE_NODE_GAP,
} from '../_constants/roadmap-flow.constants';

const COMPACT_AXIS_Y_SPACING = 190;

interface BuildFlowNodesOptions {
  compactAxis?: boolean;
  hasActiveFilters?: boolean;
  matchedNodeIds?: Set<string>;
  searchQuery?: string;
}

function getFlowNodeKind(node: RoadmapNode): RoadmapFlowNodeKind {
  if (node.nodeType === 'GROUP') return 'roadmapGroup';
  if (node.nodeType === 'MILESTONE') return 'milestone';
  return 'skill';
}

function matchesSearchQuery(node: RoadmapNode, query?: string) {
  const normalizedQuery = query?.trim().toLowerCase();
  if (!normalizedQuery) return false;

  return `${node.name} ${node.description ?? ''}`.toLowerCase().includes(normalizedQuery);
}

function buildTitleNode(
  roadmapNodes: RoadmapNode[],
  title: string,
  searchQuery?: string,
): RoadmapFlowNode[] {
  const firstSpineNode = getFirstVisibleSpineNode(roadmapNodes);
  const firstVisibleNode = getFirstVisibleNode(roadmapNodes);
  const titleAnchorNode = firstSpineNode ?? firstVisibleNode;

  if (!titleAnchorNode) return [];

  const titleAnchorNodeSize = getNodeSize();
  const titleAnchorNodeCenterX = titleAnchorNode.posX + titleAnchorNodeSize.width / 2;

  const titleX = titleAnchorNodeCenterX - ROADMAP_FLOW_NODE_SIZES.title.width / 2;
  const titleY = titleAnchorNode.posY - ROADMAP_FLOW_NODE_SIZES.title.height - TITLE_NODE_GAP;

  return [
    {
      data: { searchQuery, title },
      draggable: false,
      id: ROADMAP_TITLE_NODE_ID,
      position: { x: titleX, y: titleY },
      type: 'roadmapTitle',
      zIndex: 2,
    },
  ];
}

function getFirstVisibleNode(roadmapNodes: RoadmapNode[]): RoadmapNode | undefined {
  return [...roadmapNodes].sort(
    (left, right) => left.posY - right.posY || left.posX - right.posX,
  )[0];
}

function getFirstVisibleSpineNode(roadmapNodes: RoadmapNode[]): RoadmapNode | undefined {
  return roadmapNodes
    .filter(
      (node) => !node.parentId && (node.nodeType === 'GROUP' || node.nodeType === 'MILESTONE'),
    )
    .sort((left, right) => left.posY - right.posY || left.posX - right.posX)[0];
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
    const parent = node.parentId ? nodeById.get(node.parentId) : null;
    const markerSide: RoadmapFlowNodeData['markerSide'] =
      parent && (node.nodeType === 'REQUIRED' || node.nodeType === 'OPTIONAL')
        ? node.posX + ROADMAP_FLOW_NODE_SIZES.node.width / 2 < parent.posX + getNodeSize().width / 2
          ? 'left'
          : 'right'
        : undefined;

    const matchState: RoadmapFlowNodeData['matchState'] = !options.hasActiveFilters
      ? 'normal'
      : options.matchedNodeIds?.has(node.id)
        ? 'matched'
        : 'dimmed';

    return {
      data: {
        markerSide,
        matchState,
        node,
        searchMatched: matchesSearchQuery(node, options.searchQuery),
        searchQuery: options.searchQuery,
        visualStatus: node.progress?.status ?? 'LOCKED',
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

export function compactAxisLayout(roadmapNodes: RoadmapNode[]): RoadmapNode[] {
  const axisNodes = roadmapNodes
    .filter((node) => node.nodeType === 'GROUP' || node.nodeType === 'MILESTONE')
    .sort((left, right) => left.posY - right.posY || left.posX - right.posX);

  if (axisNodes.length <= 1 || axisNodes.length !== roadmapNodes.length) {
    return roadmapNodes;
  }

  const firstY = axisNodes[0]?.posY ?? 0;
  const compactYById = new Map(
    axisNodes.map((node, index) => [node.id, firstY + index * COMPACT_AXIS_Y_SPACING]),
  );

  return roadmapNodes.map((node) => ({
    ...node,
    posY: compactYById.get(node.id) ?? node.posY,
  }));
}

function getNodeSize() {
  return ROADMAP_FLOW_NODE_SIZES.node;
}

function buildParentChildEdges(roadmapNodes: RoadmapNode[]): Edge[] {
  const nodeById = new Map(roadmapNodes.map((node) => [node.id, node]));

  return roadmapNodes.flatMap((node) => {
    if (!node.parentId) return [];

    const parent = nodeById.get(node.parentId);
    if (!parent) return [];

    const parentSize = getNodeSize();
    const nodeSize = getNodeSize();
    const parentCenterX = parent.posX + parentSize.width / 2;
    const nodeCenterX = node.posX + nodeSize.width / 2;
    const childIsLeft = nodeCenterX < parentCenterX;

    return {
      animated: node.progress?.status !== 'COMPLETED',
      focusable: false,
      id: `parent-${parent.id}-${node.id}`,
      selectable: false,
      source: parent.id,
      sourceHandle: childIsLeft ? 'left-source' : 'right-source',
      style: { stroke: '#000000', strokeWidth: 2 },
      target: node.id,
      targetHandle: childIsLeft ? 'right-target' : 'left-target',
      type: 'smoothstep',
    };
  });
}

function buildProgressionEdges(roadmapNodes: RoadmapNode[]): Edge[] {
  const progressionNodes = roadmapNodes
    .filter(
      (node) => !node.parentId && (node.nodeType === 'GROUP' || node.nodeType === 'MILESTONE'),
    )
    .sort((left, right) => left.posY - right.posY || left.posX - right.posX);

  return progressionNodes.slice(0, -1).map((node, index) => ({
    animated: false,
    focusable: false,
    id: `progression-${node.id}-${progressionNodes[index + 1]?.id}`,
    selectable: false,
    source: node.id,
    sourceHandle: 'bottom',
    style: { stroke: '#000000', strokeWidth: 2 },
    target: progressionNodes[index + 1]?.id ?? node.id,
    targetHandle: 'top',
    type: 'smoothstep',
  }));
}

function buildTitleEdge(roadmapNodes: RoadmapNode[]): Edge[] {
  const firstSpineNode = getFirstVisibleSpineNode(roadmapNodes);
  const firstVisibleNode = getFirstVisibleNode(roadmapNodes);
  const titleAnchorNode = firstSpineNode ?? firstVisibleNode;

  if (!titleAnchorNode) return [];

  return [
    {
      focusable: false,
      id: `progression-${ROADMAP_TITLE_NODE_ID}-${titleAnchorNode.id}`,
      selectable: false,
      source: ROADMAP_TITLE_NODE_ID,
      sourceHandle: 'bottom',
      style: { stroke: '#000000', strokeWidth: 2 },
      target: titleAnchorNode.id,
      targetHandle: 'top',
      type: 'smoothstep',
    },
  ];
}

export function buildFlowEdges(roadmapNodes: RoadmapNode[]): Edge[] {
  return [
    ...buildParentChildEdges(roadmapNodes),
    ...buildTitleEdge(roadmapNodes),
    ...buildProgressionEdges(roadmapNodes),
  ];
}
