'use client';

import { useCallback, useMemo } from 'react';

import { useRoadmapDisplayMode } from './use-roadmap-display-mode';
import { useRoadmapFilters } from './use-roadmap-filters';
import { useRoadmapNodes } from './use-roadmap-nodes';

interface UseRoadmapGraphDataOptions {
  roadmapId: string;
}

export function useRoadmapGraphData({ roadmapId }: UseRoadmapGraphDataOptions) {
  const { displayMode, setDisplayMode } = useRoadmapDisplayMode();
  const { debouncedQuery, nodeType, query, setQuery, status, updateUrlFilters } =
    useRoadmapFilters();
  const isSearchFilterActive = Boolean(query.trim() || debouncedQuery.trim() || status || nodeType);
  const shouldFetchMatchedNodes = Boolean(debouncedQuery.trim() || status || nodeType);
  const {
    errorMessage: baseErrorMessage,
    isLoading: isBaseLoading,
    refreshRoadmapNodes: refreshBaseRoadmapNodes,
    roadmapNodes: baseRoadmapNodes,
  } = useRoadmapNodes({
    nodeType: null,
    roadmapId,
    searchQuery: '',
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
    status,
  });
  const effectiveMatchedRoadmapNodes = useMemo(
    () => (shouldFetchMatchedNodes && !isMatchedLoading ? matchedRoadmapNodes : []),
    [isMatchedLoading, matchedRoadmapNodes, shouldFetchMatchedNodes],
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
    status,
    updateUrlFilters,
  };
}
