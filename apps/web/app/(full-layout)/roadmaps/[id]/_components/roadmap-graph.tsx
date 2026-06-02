'use client';

import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { useCallback, useEffect, useMemo } from 'react';

import type { RoadmapDetailMode } from '../_hooks/use-roadmap-detail';

import { useRoadmapFlowState } from '../_hooks/use-roadmap-flow-state';
import { useRoadmapGraphData } from '../_hooks/use-roadmap-graph-data';
import { useRoadmapNodeSelection } from '../_hooks/use-roadmap-node-selection';
import { canOpenRoadmapNodeDetail } from '../_utils/roadmap-node.utils';
import { RoadmapFilterBar } from './roadmap-filter-bar';
import { RoadmapGraphState } from './roadmap-graph-state';
import { RoadmapNodeDetailDrawer } from './roadmap-node-detail-drawer';
import { RoadmapSkillTree } from './roadmap-skill-tree';
import { RoadmapStackList } from './roadmap-stack-list';

interface RoadmapGraphProps {
  isAuthenticatedRoadmapView: boolean;
  mode: RoadmapDetailMode | null;
  onProgressUpdated?: () => void;
  roadmapId: string;
  roadmapTitle: string;
}

export function RoadmapGraph({
  isAuthenticatedRoadmapView,
  mode,
  onProgressUpdated,
  roadmapId,
  roadmapTitle,
}: RoadmapGraphProps) {
  const {
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
  } = useRoadmapGraphData({ mode, roadmapId });
  const { clearSelectedNode, selectNode, selectedNodeId } = useRoadmapNodeSelection();
  const { desktopFlowLayout, edges, layoutRoadmapNodes, nodes, onEdgesChange, onNodesChange } =
    useRoadmapFlowState({
      hasActiveFilters: isSearchFilterActive,
      matchedNodeIds,
      roadmapNodes: baseRoadmapNodes,
      searchQuery: debouncedQuery,
      shouldCompactAxis: false,
      title: roadmapTitle,
    });
  const selectedRoadmapNode = useMemo(
    () =>
      selectedNodeId ? baseRoadmapNodes.find((node) => node.id === selectedNodeId) : undefined,
    [baseRoadmapNodes, selectedNodeId],
  );
  const effectiveSelectedNodeId =
    selectedRoadmapNode && canOpenRoadmapNodeDetail(selectedRoadmapNode) ? selectedNodeId : null;

  useEffect(() => {
    if (selectedNodeId && selectedRoadmapNode && !canOpenRoadmapNodeDetail(selectedRoadmapNode)) {
      clearSelectedNode();
    }
  }, [clearSelectedNode, selectedNodeId, selectedRoadmapNode]);

  const handleProgressUpdated = useCallback(() => {
    refreshRoadmapNodes();
    onProgressUpdated?.();
  }, [onProgressUpdated, refreshRoadmapNodes]);

  const selectedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        selected: Boolean(node.data.node && node.data.node.id === effectiveSelectedNodeId),
      })),
    [effectiveSelectedNodeId, nodes],
  );

  return (
    <>
      <SectionContainer className="relative z-10 flex flex-col gap-5 pb-8">
        <RoadmapFilterBar
          canFilterByStatus={isAuthenticatedRoadmapView}
          displayMode={displayMode}
          isMatchingLoading={shouldFetchMatchedNodes && isMatchedLoading}
          isSearchActive={isSearchFilterActive}
          matchedCount={effectiveMatchedRoadmapNodes.length}
          nodeType={nodeType}
          onDisplayModeChange={setDisplayMode}
          onNodeTypeChange={(nextNodeType) => updateUrlFilters({ nodeType: nextNodeType })}
          onQueryChange={setQuery}
          onStatusChange={(nextStatus) => updateUrlFilters({ status: nextStatus })}
          query={query}
          resultCount={baseRoadmapNodes.length}
          status={status}
        />

        {isLoading ? (
          <RoadmapGraphState kind="loading" />
        ) : errorMessage ? (
          <RoadmapGraphState
            errorMessage={errorMessage}
            kind="error"
            onRetry={refreshRoadmapNodes}
          />
        ) : baseRoadmapNodes.length === 0 ? (
          <RoadmapGraphState kind="empty" />
        ) : displayMode === 'skill-tree' ? (
          <RoadmapSkillTree
            desktopFlowLayout={desktopFlowLayout}
            edgeChanges={onEdgesChange}
            edges={edges}
            nodeChanges={onNodesChange}
            nodes={selectedNodes}
            onNodeSelect={selectNode}
            treeKey={`${baseRoadmapNodes.length}-${desktopFlowLayout.width}-${desktopFlowLayout.height}`}
          />
        ) : null}
      </SectionContainer>

      {!isLoading &&
      !errorMessage &&
      baseRoadmapNodes.length > 0 &&
      displayMode === 'stack-list' ? (
        <SectionContainer className="relative z-10 flex flex-col gap-5 pb-20">
          {isSearchFilterActive && stackListNodes.length === 0 ? (
            <RoadmapGraphState kind="no-matches" />
          ) : (
            <RoadmapStackList
              baseNodes={baseRoadmapNodes}
              isFiltered={isSearchFilterActive}
              nodes={isSearchFilterActive ? stackListNodes : layoutRoadmapNodes}
              nodeType={nodeType}
              onNodeSelect={selectNode}
              searchQuery={debouncedQuery}
              status={status}
            />
          )}
        </SectionContainer>
      ) : null}

      <RoadmapNodeDetailDrawer
        canManageProgress={isAuthenticatedRoadmapView}
        onProgressUpdated={handleProgressUpdated}
        roadmapId={roadmapId}
        roadmapNodes={baseRoadmapNodes}
        selectedNodeId={effectiveSelectedNodeId}
        onOpenChange={(isOpen) => {
          if (!isOpen) clearSelectedNode();
        }}
      />
    </>
  );
}
