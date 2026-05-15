'use client';

import { useEdgesState, useNodesState } from '@xyflow/react';
import { useEffect, useMemo } from 'react';

import type { RoadmapNode } from '../_types/roadmap-node.types';

import { ROADMAP_FLOW_NODE_SIZES, TITLE_NODE_GAP } from '../_constants/roadmap-flow.constants';
import { buildFlowEdges, buildFlowNodes, compactAxisLayout } from '../_utils/roadmap-flow.utils';

const DESKTOP_FLOW_PADDING = 96;

function getRoadmapNodeSize() {
  return ROADMAP_FLOW_NODE_SIZES.node;
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

function getDesktopFlowLayout(roadmapNodes: RoadmapNode[]) {
  if (roadmapNodes.length === 0) {
    return {
      height: 600,
      viewport: { x: DESKTOP_FLOW_PADDING, y: DESKTOP_FLOW_PADDING, zoom: 1 },
      width: 960,
    };
  }

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

  const titleAnchorNode =
    getFirstVisibleSpineNode(roadmapNodes) ?? getFirstVisibleNode(roadmapNodes);

  if (titleAnchorNode) {
    const titleAnchorNodeSize = getRoadmapNodeSize();
    const titleX =
      titleAnchorNode.posX +
      titleAnchorNodeSize.width / 2 -
      ROADMAP_FLOW_NODE_SIZES.title.width / 2;
    const titleY = titleAnchorNode.posY - ROADMAP_FLOW_NODE_SIZES.title.height - TITLE_NODE_GAP;

    bounds.minX = Math.min(bounds.minX, titleX);
    bounds.minY = Math.min(bounds.minY, titleY);
    bounds.maxX = Math.max(bounds.maxX, titleX + ROADMAP_FLOW_NODE_SIZES.title.width);
    bounds.maxY = Math.max(bounds.maxY, titleY + ROADMAP_FLOW_NODE_SIZES.title.height);
  }

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

interface UseRoadmapFlowStateOptions {
  hasActiveFilters?: boolean;
  matchedNodeIds?: Set<string>;
  roadmapNodes: RoadmapNode[];
  searchQuery: string;
  shouldCompactAxis: boolean;
  title: string;
}

export function useRoadmapFlowState({
  hasActiveFilters = false,
  matchedNodeIds,
  roadmapNodes,
  searchQuery,
  shouldCompactAxis,
  title,
}: UseRoadmapFlowStateOptions) {
  const layoutRoadmapNodes = useMemo(
    () => (shouldCompactAxis ? compactAxisLayout(roadmapNodes) : roadmapNodes),
    [roadmapNodes, shouldCompactAxis],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(
    buildFlowNodes(roadmapNodes, title, {
      compactAxis: shouldCompactAxis,
      hasActiveFilters,
      matchedNodeIds,
      searchQuery,
    }),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildFlowEdges(layoutRoadmapNodes));
  const desktopFlowLayout = useMemo(
    () => getDesktopFlowLayout(layoutRoadmapNodes),
    [layoutRoadmapNodes],
  );

  useEffect(() => {
    setNodes(
      buildFlowNodes(roadmapNodes, title, {
        compactAxis: shouldCompactAxis,
        hasActiveFilters,
        matchedNodeIds,
        searchQuery,
      }),
    );
    setEdges(buildFlowEdges(layoutRoadmapNodes));
  }, [
    hasActiveFilters,
    layoutRoadmapNodes,
    matchedNodeIds,
    roadmapNodes,
    searchQuery,
    setEdges,
    setNodes,
    shouldCompactAxis,
    title,
  ]);

  return {
    desktopFlowLayout,
    edges,
    layoutRoadmapNodes,
    nodes,
    onEdgesChange,
    onNodesChange,
  };
}
