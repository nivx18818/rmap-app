import type { RoadmapNode } from '../_types/roadmap-node.types';

import { ROADMAP_FLOW_NODE_SIZES, TITLE_NODE_GAP } from '../_constants/roadmap-flow.constants';
import {
  getFirstVisibleNode,
  getFirstVisibleSpineNode,
  isAxisNode,
  sortRoadmapNodes,
} from './roadmap-node.utils';

const COMPACT_AXIS_Y_SPACING = 190;
const DESKTOP_FLOW_PADDING = 96;

export function getRoadmapNodeSize() {
  return ROADMAP_FLOW_NODE_SIZES.node;
}

export function compactAxisLayout(roadmapNodes: RoadmapNode[]): RoadmapNode[] {
  const axisNodes = roadmapNodes.filter(isAxisNode).sort(sortRoadmapNodes);

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

export function getTitleNodePosition(roadmapNodes: RoadmapNode[]) {
  const firstSpineNode = getFirstVisibleSpineNode(roadmapNodes);
  const firstVisibleNode = getFirstVisibleNode(roadmapNodes);
  const titleAnchorNode = firstSpineNode ?? firstVisibleNode;

  if (!titleAnchorNode) return null;

  const titleAnchorNodeSize = getRoadmapNodeSize();
  const titleAnchorNodeCenterX = titleAnchorNode.posX + titleAnchorNodeSize.width / 2;

  return {
    x: titleAnchorNodeCenterX - ROADMAP_FLOW_NODE_SIZES.title.width / 2,
    y: titleAnchorNode.posY - ROADMAP_FLOW_NODE_SIZES.title.height - TITLE_NODE_GAP,
  };
}

export function calculateFlowBounds(roadmapNodes: RoadmapNode[]) {
  const bounds = roadmapNodes.reduce(
    (acc, node) => {
      const size = getRoadmapNodeSize();

      return {
        maxX: Math.max(acc.maxX, node.posX + size.width),
        maxY: Math.max(acc.maxY, node.posY + size.height),
        minX: Math.min(acc.minX, node.posX),
        minY: Math.min(acc.minY, node.posY),
      };
    },
    {
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
    },
  );

  const titlePosition = getTitleNodePosition(roadmapNodes);

  if (titlePosition) {
    bounds.minX = Math.min(bounds.minX, titlePosition.x);
    bounds.minY = Math.min(bounds.minY, titlePosition.y);
    bounds.maxX = Math.max(bounds.maxX, titlePosition.x + ROADMAP_FLOW_NODE_SIZES.title.width);
    bounds.maxY = Math.max(bounds.maxY, titlePosition.y + ROADMAP_FLOW_NODE_SIZES.title.height);
  }

  return bounds;
}

export function getDesktopFlowLayout(roadmapNodes: RoadmapNode[]) {
  if (roadmapNodes.length === 0) {
    return {
      height: 600,
      viewport: { x: DESKTOP_FLOW_PADDING, y: DESKTOP_FLOW_PADDING, zoom: 1 },
      width: 960,
    };
  }

  const bounds = calculateFlowBounds(roadmapNodes);

  return {
    height: Math.ceil(bounds.maxY - bounds.minY + DESKTOP_FLOW_PADDING * 2),
    viewport: {
      x: DESKTOP_FLOW_PADDING - bounds.minX,
      y: DESKTOP_FLOW_PADDING - bounds.minY,
      zoom: 1,
    },
    width: Math.ceil(bounds.maxX - bounds.minX + DESKTOP_FLOW_PADDING * 2),
  };
}
