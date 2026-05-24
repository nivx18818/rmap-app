import type { Edge } from '@xyflow/react';

import type { RoadmapNode } from '../_types/roadmap-node.types';

import { ROADMAP_TITLE_NODE_ID } from '../_constants/roadmap-flow.constants';
import { getRoadmapNodeSize } from './roadmap-flow-layout.utils';
import {
  getFirstVisibleNode,
  getFirstVisibleSpineNode,
  isAxisNode,
  sortRoadmapNodes,
} from './roadmap-node.utils';

export function buildParentChildEdges(roadmapNodes: RoadmapNode[]): Edge[] {
  const nodeById = new Map(roadmapNodes.map((node) => [node.id, node]));

  return roadmapNodes.flatMap((node) => {
    if (!node.parentId) return [];

    const parent = nodeById.get(node.parentId);
    if (!parent) return [];

    const parentSize = getRoadmapNodeSize();
    const nodeSize = getRoadmapNodeSize();
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
      type: 'bezier',
    };
  });
}

export function buildProgressionEdges(roadmapNodes: RoadmapNode[]): Edge[] {
  const progressionNodes = roadmapNodes
    .filter((node) => !node.parentId && isAxisNode(node))
    .sort(sortRoadmapNodes);

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

export function buildTitleEdge(roadmapNodes: RoadmapNode[]): Edge[] {
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
