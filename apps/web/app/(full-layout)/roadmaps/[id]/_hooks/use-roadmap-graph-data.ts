'use client';

import { useCallback, useMemo } from 'react';

import type { RoadmapDetailMode } from './use-roadmap-detail';

import { filterRoadmapNodes } from '../_utils/roadmap-filter.utils';
import { useRoadmapDisplayMode } from './use-roadmap-display-mode';
import { useRoadmapFilters } from './use-roadmap-filters';
import { useRoadmapNodes } from './use-roadmap-nodes';

interface UseRoadmapGraphDataOptions {
  mode: RoadmapDetailMode | null;
  roadmapId: string;
}

export function useRoadmapGraphData({ mode, roadmapId }: UseRoadmapGraphDataOptions) {
  const { displayMode, setDisplayMode } = useRoadmapDisplayMode();
  const { debouncedQuery, nodeType, query, setQuery, status, updateUrlFilters } =
    useRoadmapFilters();
  const isTemplateRoadmap = mode === 'template';
  const isPersonalRoadmap = mode === 'personal';
  const effectiveStatus = isPersonalRoadmap ? status : null;
  const isSearchFilterActive = Boolean(
    query.trim() || debouncedQuery.trim() || effectiveStatus || nodeType,
  );
  const shouldApplyMatchedNodes = Boolean(debouncedQuery.trim() || effectiveStatus || nodeType);
  const shouldFetchMatchedNodes = isPersonalRoadmap && shouldApplyMatchedNodes;
  const {
    errorMessage: baseErrorMessage,
    isLoading: isBaseLoading,
    refreshRoadmapNodes: refreshBaseRoadmapNodes,
    roadmapNodes: baseRoadmapNodes,
  } = useRoadmapNodes({
    enabled: mode !== null,
    nodeType: null,
    roadmapId,
    searchQuery: '',
    source: isTemplateRoadmap ? 'template' : 'personal',
    status: null,
  });
  const {
    errorMessage: matchedErrorMessage,
    isLoading: isMatchedLoading,
    refreshRoadmapNodes: refreshMatchedRoadmapNodes,
    roadmapNodes: matchedRoadmapNodes,
  } = useRoadmapNodes({
    enabled: shouldFetchMatchedNodes,
    nodeType,
    roadmapId,
    searchQuery: debouncedQuery,
    status: effectiveStatus,
  });
  const templateMatchedRoadmapNodes = useMemo(
    () =>
      isTemplateRoadmap && shouldApplyMatchedNodes
        ? filterRoadmapNodes(baseRoadmapNodes, {
            nodeType,
            searchQuery: debouncedQuery,
            status: null,
          })
        : [],
    [baseRoadmapNodes, debouncedQuery, isTemplateRoadmap, nodeType, shouldApplyMatchedNodes],
  );
  const effectiveMatchedRoadmapNodes = useMemo(
    () =>
      isTemplateRoadmap
        ? templateMatchedRoadmapNodes
        : shouldFetchMatchedNodes && !isMatchedLoading
          ? matchedRoadmapNodes
          : [],
    [
      isMatchedLoading,
      isTemplateRoadmap,
      matchedRoadmapNodes,
      shouldFetchMatchedNodes,
      templateMatchedRoadmapNodes,
    ],
  );
  const matchedNodeIds = useMemo(
    () => new Set(effectiveMatchedRoadmapNodes.map((node) => node.id)),
    [effectiveMatchedRoadmapNodes],
  );
  const stackListNodes = isSearchFilterActive ? effectiveMatchedRoadmapNodes : baseRoadmapNodes;
  const errorMessage = baseErrorMessage ?? (shouldFetchMatchedNodes ? matchedErrorMessage : null);
  const isLoading =
    isBaseLoading || (displayMode === 'stack-list' && shouldFetchMatchedNodes && isMatchedLoading);

  const refreshRoadmapNodes = useCallback(() => {
    void refreshBaseRoadmapNodes();
    if (shouldFetchMatchedNodes) {
      void refreshMatchedRoadmapNodes();
    }
  }, [refreshBaseRoadmapNodes, refreshMatchedRoadmapNodes, shouldFetchMatchedNodes]);

  return {
    baseRoadmapNodes,
    debouncedQuery,
    displayMode,
    effectiveMatchedRoadmapNodes,
    errorMessage,
    isLoading,
    isMatchedLoading,
    isSearchFilterActive,
    matchedNodeIds,
    nodeType,
    query,
    refreshRoadmapNodes,
    setDisplayMode,
    setQuery,
    shouldFetchMatchedNodes,
    stackListNodes,
    status: effectiveStatus,
    updateUrlFilters,
  };
}
