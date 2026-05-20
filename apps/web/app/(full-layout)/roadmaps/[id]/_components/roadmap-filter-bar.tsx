'use client';

import { Badge } from '@repo/design-system/components/ui/badge';

import type { RoadmapDisplayMode } from '../_types/roadmap-display-mode.types';
import type { NodeType, ProgressStatus } from '../_types/roadmap-node.types';

import {
  NODE_TYPE_LABELS,
  NODE_TYPE_URL_VALUES,
  STATUS_LABELS,
  STATUS_URL_VALUES,
} from '../_constants/roadmap-node.constants';
import { RoadmapDisplayModeSwitch } from './roadmap-display-mode-switch';
import { RoadmapFilterDrawer } from './roadmap-filter-drawer';
import { RoadmapFilterLegend } from './roadmap-filter-legend';
import { RoadmapSearchInput } from './roadmap-search-input';

interface RoadmapFilterBarProps {
  displayMode: RoadmapDisplayMode;
  isMatchingLoading: boolean;
  isSearchActive: boolean;
  matchedCount: number;
  nodeType: NodeType | null;
  onDisplayModeChange: (displayMode: RoadmapDisplayMode) => void;
  onNodeTypeChange: (nodeType: NodeType | null) => void;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: ProgressStatus | null) => void;
  query: string;
  resultCount: number;
  status: ProgressStatus | null;
}

export function RoadmapFilterBar({
  displayMode,
  isMatchingLoading,
  isSearchActive,
  matchedCount,
  nodeType,
  onDisplayModeChange,
  onNodeTypeChange,
  onQueryChange,
  onStatusChange,
  query,
  resultCount,
  status,
}: RoadmapFilterBarProps) {
  const title = displayMode === 'stack-list' ? 'Stack List' : 'Skill tree';
  const defaultDescription =
    displayMode === 'stack-list'
      ? 'Review roadmap lessons in a focused list for sequential learning.'
      : 'Explore skill dependencies and milestones as a connected roadmap tree.';
  const resultUnit = displayMode === 'stack-list' ? 'lessons' : 'nodes';
  const trimmedQuery = query.trim();
  const activeDescriptions = [
    nodeType ? `${NODE_TYPE_LABELS[nodeType]} nodes` : null,
    status ? `${STATUS_LABELS[status].toLowerCase()} status` : null,
    trimmedQuery ? `search "${trimmedQuery}"` : null,
  ].filter(Boolean);
  const description =
    activeDescriptions.length > 0
      ? `${isMatchingLoading ? 'Filtering' : 'Showing'} ${activeDescriptions.join(' with ')}.`
      : defaultDescription;

  return (
    <div className="border-border bg-background/90 flex w-full flex-col gap-4 rounded-lg border p-3 shadow-sm backdrop-blur-sm sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-foreground text-base font-semibold sm:text-lg">{title}</h2>
            <Badge variant="secondary">
              {resultCount} {resultUnit}
            </Badge>
            <RoadmapFilterLegend displayMode={displayMode} />
          </div>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <RoadmapSearchInput
              isMatchingLoading={isMatchingLoading}
              isSearchActive={isSearchActive}
              matchedCount={matchedCount}
              onQueryChange={onQueryChange}
              query={query}
            />
            <RoadmapFilterDrawer
              nodeType={nodeType}
              onNodeTypeChange={onNodeTypeChange}
              onStatusChange={onStatusChange}
              status={status}
            />
            <RoadmapDisplayModeSwitch value={displayMode} onChange={onDisplayModeChange} />
          </div>
        </div>
      </div>

      <span className="sr-only">
        Current filters use status {status ? STATUS_URL_VALUES[status] : 'all'} and node type{' '}
        {nodeType ? NODE_TYPE_URL_VALUES[nodeType] : 'all'}.
      </span>
    </div>
  );
}
