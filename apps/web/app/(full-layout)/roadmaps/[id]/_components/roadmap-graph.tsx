'use client';

import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { Button } from '@repo/design-system/components/ui/button';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { cn } from '@repo/design-system/lib/utils';
import { ReactFlow } from '@xyflow/react';
import { useMemo } from 'react';

import { useRoadmapDisplayMode } from '../_hooks/use-roadmap-display-mode';
import { useRoadmapFilters } from '../_hooks/use-roadmap-filters';
import { useRoadmapFlowState } from '../_hooks/use-roadmap-flow-state';
import { useRoadmapNodes } from '../_hooks/use-roadmap-nodes';
import { type RoadmapNodeTypes } from '../_types/roadmap-flow.types';
import { RoadmapFilterBar } from './roadmap-filter-bar';
import {
  RoadmapGroupNode,
  RoadmapMilestoneNode,
  RoadmapSkillNode,
  RoadmapTitleNode,
} from './roadmap-flow-node';
import { RoadmapStackList } from './roadmap-stack-list';

const nodeTypes = {
  milestone: RoadmapMilestoneNode,
  roadmapGroup: RoadmapGroupNode,
  roadmapTitle: RoadmapTitleNode,
  skill: RoadmapSkillNode,
} satisfies RoadmapNodeTypes;

const ROADMAP_STATE_CONTAINER_CLASS =
  'border-border bg-background/80 overflow-hidden rounded-lg border shadow-sm backdrop-blur-sm min-h-[20rem] sm:min-h-[28rem] lg:min-h-[37.5rem]';

interface RoadmapGraphProps {
  roadmapId: string;
}

export function RoadmapGraph({ roadmapId }: RoadmapGraphProps) {
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
  const { desktopFlowLayout, edges, layoutRoadmapNodes, nodes, onEdgesChange, onNodesChange } =
    useRoadmapFlowState({
      hasActiveFilters: isSearchFilterActive,
      matchedNodeIds,
      roadmapNodes: baseRoadmapNodes,
      searchQuery: debouncedQuery,
      shouldCompactAxis: false,
      title: 'Roadmap',
    });

  const refreshRoadmapNodes = () => {
    void refreshBaseRoadmapNodes();
    if (shouldFetchMatchedNodes) {
      void refreshMatchedRoadmapNodes();
    }
  };

  return (
    <>
      <SectionContainer className="relative z-10 flex flex-col gap-5 pb-8">
        <RoadmapFilterBar
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
          <div className={ROADMAP_STATE_CONTAINER_CLASS}>
            <div className="flex h-full flex-col gap-4 p-4 sm:p-5">
              <Skeleton className="h-10 w-40 sm:w-64" />
              <Skeleton className="min-h-56 w-full sm:min-h-88 lg:min-h-120" />
            </div>
          </div>
        ) : errorMessage ? (
          <div
            className={cn(
              ROADMAP_STATE_CONTAINER_CLASS,
              'flex h-full flex-col items-center justify-center gap-3 px-4 py-10 text-center sm:px-6',
            )}
          >
            <div className="flex max-w-md flex-col gap-2">
              <h2 className="text-foreground text-lg font-semibold sm:text-xl">
                The roadmap is unavailable now
              </h2>
              <p className="text-muted-foreground text-sm">{errorMessage}</p>
            </div>
            <Button type="button" onClick={refreshRoadmapNodes}>
              Retry
            </Button>
          </div>
        ) : baseRoadmapNodes.length === 0 ? (
          <div
            className={cn(
              ROADMAP_STATE_CONTAINER_CLASS,
              'flex h-full flex-col items-center justify-center gap-3 px-4 py-10 text-center sm:px-6',
            )}
          >
            <h2 className="text-foreground text-lg font-semibold sm:text-xl">No visible nodes</h2>
            <p className="text-muted-foreground max-w-md text-sm">
              Adjust the filters or search query to show roadmap nodes.
            </p>
          </div>
        ) : displayMode === 'skill-tree' ? (
          <div
            className="mx-auto w-full overflow-hidden"
            style={{
              aspectRatio:
                desktopFlowLayout.width && desktopFlowLayout.height
                  ? `${desktopFlowLayout.width} / ${desktopFlowLayout.height}`
                  : 'auto',
              maxWidth: desktopFlowLayout.width ? `${desktopFlowLayout.width}px` : '100%',
            }}
          >
            <ReactFlow
              key={`${baseRoadmapNodes.length}-${desktopFlowLayout.width}-${desktopFlowLayout.height}`}
              minZoom={0.05}
              colorMode="light"
              edges={edges}
              elementsSelectable={false}
              fitView
              fitViewOptions={{ padding: 0.05 }}
              nodes={nodes}
              nodesConnectable={false}
              nodesDraggable={false}
              nodeTypes={nodeTypes}
              onEdgesChange={onEdgesChange}
              onNodesChange={onNodesChange}
              panOnDrag={false}
              panOnScroll={false}
              preventScrolling={false}
              proOptions={{ hideAttribution: true }}
              zoomOnDoubleClick={false}
              zoomOnPinch={false}
              zoomOnScroll={false}
            />
          </div>
        ) : null}
      </SectionContainer>

      {!isLoading &&
      !errorMessage &&
      baseRoadmapNodes.length > 0 &&
      displayMode === 'stack-list' ? (
        <SectionContainer className="relative z-10 flex flex-col gap-5 pb-20">
          {isSearchFilterActive && stackListNodes.length === 0 ? (
            <div className="border-border bg-background/80 flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-10 text-center shadow-sm backdrop-blur-sm sm:px-6">
              <h2 className="text-foreground text-lg font-semibold sm:text-xl">
                No matching nodes found
              </h2>
              <p className="text-muted-foreground max-w-md text-sm">
                Clear search, adjust filters, or try another keyword.
              </p>
            </div>
          ) : (
            <RoadmapStackList
              baseNodes={baseRoadmapNodes}
              isFiltered={isSearchFilterActive}
              nodes={isSearchFilterActive ? stackListNodes : layoutRoadmapNodes}
              nodeType={nodeType}
              searchQuery={debouncedQuery}
              status={status}
            />
          )}
        </SectionContainer>
      ) : null}
    </>
  );
}
