'use client';

import { useEdgesState, useNodesState } from '@xyflow/react';
import { useEffect, useMemo } from 'react';

import type { RoadmapNode } from '../_types/roadmap-node.types';

import { getDesktopFlowLayout } from '../_utils/roadmap-flow-layout.utils';
import { buildFlowEdges, buildFlowNodes, compactAxisLayout } from '../_utils/roadmap-flow.utils';

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
