'use client';

import {
  Award01Icon,
  CircleLock01Icon,
  FilterVerticalIcon,
  InformationCircleIcon,
  MedalFirstPlaceIcon,
  Progress02Icon,
  Search01Icon,
  Tick04Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/design-system/components/ui/drawer';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@repo/design-system/components/ui/hover-card';
import { Input } from '@repo/design-system/components/ui/input';
import { Separator } from '@repo/design-system/components/ui/separator';
import { cn } from '@repo/design-system/lib/utils';
import { useEffect, useState } from 'react';

import type { NodeType, ProgressStatus } from '../_types/roadmap-node.types';

import { milestoneMarkerClasses, skillMarkerClasses } from '../_constants/roadmap-flow.constants';
import {
  NODE_TYPE_LABELS,
  NODE_TYPE_URL_VALUES,
  STATUS_LABELS,
  STATUS_URL_VALUES,
} from '../_types/roadmap-flow.types';

export type RoadmapDisplayMode = 'stack-list' | 'skill-tree';

const STATUS_OPTIONS: Array<ProgressStatus | 'ALL'> = ['ALL', 'LOCKED', 'IN_PROGRESS', 'COMPLETED'];
const NODE_TYPE_OPTIONS: Array<NodeType | 'ALL'> = [
  'ALL',
  'GROUP',
  'MILESTONE',
  'REQUIRED',
  'OPTIONAL',
];
export const DISPLAY_MODE_OPTIONS: Array<{
  label: string;
  value: RoadmapDisplayMode;
}> = [
  { label: 'Stack List', value: 'stack-list' },
  { label: 'Skill Tree', value: 'skill-tree' },
];

function SkillTreeLegendMarker({ type }: { type: Extract<NodeType, 'OPTIONAL' | 'REQUIRED'> }) {
  return (
    <span
      className={cn(
        'flex size-5 shrink-0 items-center justify-center drop-shadow-[0_1px_2px_rgba(17,24,39,0.18)]',
        skillMarkerClasses[type],
      )}
      aria-hidden="true"
    >
      <svg className="size-full" fill="none" aria-hidden="true" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          clipRule="evenodd"
          d="M1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25C6.06294 1.25 1.25 6.06294 1.25 12Z"
          fillRule="evenodd"
        />
        <path
          fill="#ffffff"
          clipRule="evenodd"
          d="M16.6757 8.26285C17.0828 8.63604 17.1103 9.26861 16.7372 9.67573L11.2372 15.6757C11.0528 15.8768 10.7944 15.9938 10.5217 15.9998C10.249 16.0057 9.98576 15.9 9.79289 15.7071L7.29289 13.2071C6.90237 12.8166 6.90237 12.1834 7.29289 11.7929C7.68342 11.4024 8.31658 11.4024 8.70711 11.7929L10.4686 13.5544L15.2628 8.32428C15.636 7.91716 16.2686 7.88966 16.6757 8.26285Z"
          fillRule="evenodd"
        />
      </svg>
    </span>
  );
}

function SkillTreeLegendContent() {
  const legendItems = [
    {
      description: 'Core skill marker',
      icon: <SkillTreeLegendMarker type="REQUIRED" />,
      label: 'Required',
    },
    {
      description: 'Optional skill marker',
      icon: <SkillTreeLegendMarker type="OPTIONAL" />,
      label: 'Optional',
    },
    {
      description: 'Milestone marker',
      icon: (
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full shadow-sm [&_svg]:size-3.5!',
            milestoneMarkerClasses.IN_PROGRESS,
          )}
          aria-hidden="true"
        >
          <HugeiconsIcon icon={Award01Icon} />
        </span>
      ),
      label: 'Milestone',
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {legendItems.map((item) => (
        <div
          key={item.label}
          className="border-border/80 bg-muted/20 flex items-center gap-3 rounded-md border px-3 py-2"
        >
          {item.icon}
          <div className="flex min-w-0 flex-col">
            <span className="text-foreground text-sm font-medium">{item.label}</span>
            <span className="text-muted-foreground text-xs">{item.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillTreeLegendControl({
  isDrawerOpen,
  onDrawerOpenChange,
}: {
  isDrawerOpen: boolean;
  onDrawerOpenChange: (isOpen: boolean) => void;
}) {
  return (
    <>
      <HoverCard>
        <HoverCardTrigger
          className="hidden lg:inline-flex"
          render={
            <Button
              size="icon-sm"
              variant="ghost"
              className="rounded-full"
              type="button"
              aria-label="Show skill tree legend"
            >
              <HugeiconsIcon data-icon="inline-start" icon={InformationCircleIcon} />
            </Button>
          }
        />
        <HoverCardContent className="w-72 p-3" side="right" align="start">
          <div className="mb-3 flex flex-col gap-1">
            <h3 className="text-foreground text-sm font-semibold">Skill Tree Legend</h3>
            <p className="text-muted-foreground text-xs">Icon markers used on the roadmap graph.</p>
          </div>
          <SkillTreeLegendContent />
        </HoverCardContent>
      </HoverCard>

      <Drawer direction="bottom" open={isDrawerOpen} onOpenChange={onDrawerOpenChange}>
        <DrawerTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className="lg:hidden"
            type="button"
            aria-label="Open skill tree legend"
          >
            <HugeiconsIcon data-icon="inline-start" icon={InformationCircleIcon} />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Skill Tree Legend</DrawerTitle>
            <DrawerDescription>Icon markers used on the roadmap graph.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <SkillTreeLegendContent />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function StackListLegendContent() {
  const legendItems = [
    {
      description: 'Group is currently being learned',
      icon: (
        <span
          className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full [&_svg]:size-4!"
          aria-hidden="true"
        >
          <HugeiconsIcon icon={Progress02Icon} />
        </span>
      ),
      label: 'In Progress',
    },
    {
      description: 'Group has been completed',
      icon: (
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 [&_svg]:size-4!"
          aria-hidden="true"
        >
          <HugeiconsIcon icon={Tick04Icon} />
        </span>
      ),
      label: 'Completed',
    },
    {
      description: 'Group is locked',
      icon: (
        <span
          className="text-foreground flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 [&_svg]:size-4!"
          aria-hidden="true"
        >
          <HugeiconsIcon icon={CircleLock01Icon} />
        </span>
      ),
      label: 'Locked',
    },
    {
      description: 'Milestone section',
      icon: (
        <span
          className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-full [&_svg]:size-4!"
          aria-hidden="true"
        >
          <HugeiconsIcon icon={MedalFirstPlaceIcon} />
        </span>
      ),
      label: 'Milestone',
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {legendItems.map((item) => (
        <div
          key={item.label}
          className="border-border/80 bg-muted/20 flex items-center gap-3 rounded-md border px-3 py-2"
        >
          {item.icon}
          <div className="flex min-w-0 flex-col">
            <span className="text-foreground text-sm font-medium">{item.label}</span>
            <span className="text-muted-foreground text-xs">{item.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StackListLegendControl({
  isDrawerOpen,
  onDrawerOpenChange,
}: {
  isDrawerOpen: boolean;
  onDrawerOpenChange: (isOpen: boolean) => void;
}) {
  return (
    <>
      <HoverCard>
        <HoverCardTrigger
          className="hidden lg:inline-flex"
          render={
            <Button
              size="icon-sm"
              variant="ghost"
              className="rounded-full"
              type="button"
              aria-label="Show stack list legend"
            >
              <HugeiconsIcon data-icon="inline-start" icon={InformationCircleIcon} />
            </Button>
          }
        />
        <HoverCardContent className="w-80 p-3" side="right" align="start">
          <div className="mb-3 flex flex-col gap-1">
            <h3 className="text-foreground text-sm font-semibold">Stack List Legend</h3>
            <p className="text-muted-foreground text-xs">Status icons used in stack list groups.</p>
          </div>
          <StackListLegendContent />
        </HoverCardContent>
      </HoverCard>

      <Drawer direction="bottom" open={isDrawerOpen} onOpenChange={onDrawerOpenChange}>
        <DrawerTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className="lg:hidden"
            type="button"
            aria-label="Open stack list legend"
          >
            <HugeiconsIcon data-icon="inline-start" icon={InformationCircleIcon} />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Stack List Legend</DrawerTitle>
            <DrawerDescription>Status icons used in stack list groups.</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <StackListLegendContent />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

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
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isLegendDrawerOpen, setIsLegendDrawerOpen] = useState(false);
  const [isStackLegendDrawerOpen, setIsStackLegendDrawerOpen] = useState(false);
  const [drawerDirection, setDrawerDirection] = useState<'bottom' | 'right'>('bottom');
  const [draftNodeType, setDraftNodeType] = useState(nodeType);
  const [draftStatus, setDraftStatus] = useState(status);
  const title = displayMode === 'stack-list' ? 'Stack List' : 'Skill tree';
  const defaultDescription =
    displayMode === 'stack-list'
      ? 'Review roadmap lessons in a focused list for sequential learning.'
      : 'Explore skill dependencies and milestones as a connected roadmap tree.';
  const resultUnit = displayMode === 'stack-list' ? 'lessons' : 'nodes';
  const activeFilterCount = (status === null ? 0 : 1) + (nodeType === null ? 0 : 1);
  const draftActiveFilterCount = (draftStatus === null ? 0 : 1) + (draftNodeType === null ? 0 : 1);
  const hasActiveFilters = activeFilterCount > 0;
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

  const applyDraftFilters = () => {
    if (draftStatus !== status) {
      onStatusChange(draftStatus);
    }

    if (draftNodeType !== nodeType) {
      onNodeTypeChange(draftNodeType);
    }

    setIsFilterDrawerOpen(false);
  };

  const clearFiltersToAll = () => {
    setDraftStatus(null);
    setDraftNodeType(null);
    onStatusChange(null);
    onNodeTypeChange(null);
    setIsFilterDrawerOpen(false);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const updateDrawerDirection = () => {
      setDrawerDirection(mediaQuery.matches ? 'right' : 'bottom');
    };

    updateDrawerDirection();
    mediaQuery.addEventListener('change', updateDrawerDirection);

    return () => mediaQuery.removeEventListener('change', updateDrawerDirection);
  }, []);

  useEffect(() => {
    if (!isFilterDrawerOpen) return;

    setDraftNodeType(nodeType);
    setDraftStatus(status);
  }, [isFilterDrawerOpen, nodeType, status]);

  return (
    <div className="border-border bg-background/90 flex w-full flex-col gap-4 rounded-lg border p-3 shadow-sm backdrop-blur-sm sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-foreground text-base font-semibold sm:text-lg">{title}</h2>
            <Badge variant="secondary">
              {resultCount} {resultUnit}
            </Badge>
            {displayMode === 'skill-tree' ? (
              <SkillTreeLegendControl
                isDrawerOpen={isLegendDrawerOpen}
                onDrawerOpenChange={setIsLegendDrawerOpen}
              />
            ) : null}
            {displayMode === 'stack-list' ? (
              <StackListLegendControl
                isDrawerOpen={isStackLegendDrawerOpen}
                onDrawerOpenChange={setIsStackLegendDrawerOpen}
              />
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm">{description}</p>
          <div
            className="bg-muted/50 flex w-fit items-center rounded-md p-0.5"
            aria-label="Roadmap display mode"
          >
            {DISPLAY_MODE_OPTIONS.map((option) => {
              const isActive = displayMode === option.value;

              return (
                <Button
                  key={option.value}
                  size="sm"
                  variant={isActive ? 'default' : 'ghost'}
                  className="h-7 px-2.5 text-xs"
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onDisplayModeChange(option.value)}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-auto lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-2">
            <div className="relative min-w-0 flex-1 lg:w-120 lg:flex-none">
              <HugeiconsIcon
                size={22}
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                icon={Search01Icon}
              />
              <Input
                className={isSearchActive ? 'pr-28 pl-10 sm:pr-32' : 'pl-10'}
                placeholder="Search skills"
                aria-label="Search roadmap nodes"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
              />
              {isSearchActive ? (
                <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 text-xs font-medium sm:block">
                  {isMatchingLoading ? (
                    <span
                      className="border-muted-foreground/30 border-t-muted-foreground inline-flex size-4 animate-spin rounded-full border-2"
                      aria-hidden="true"
                    />
                  ) : (
                    <>
                      {matchedCount} {matchedCount === 1 ? 'node' : 'nodes'} found
                    </>
                  )}
                </span>
              ) : null}
            </div>

            <Drawer
              direction={drawerDirection}
              open={isFilterDrawerOpen}
              onOpenChange={setIsFilterDrawerOpen}
            >
              <DrawerTrigger asChild>
                <Button
                  variant={hasActiveFilters ? 'default' : 'outline'}
                  size="icon"
                  className="[&_svg]:size-5!"
                  type="button"
                  aria-label={`Open roadmap filters${hasActiveFilters ? `, ${activeFilterCount} active` : ''}`}
                >
                  <span className="relative flex items-center justify-center">
                    <HugeiconsIcon data-icon="inline-start" icon={FilterVerticalIcon} />
                    {hasActiveFilters ? (
                      <span className="bg-primary-foreground text-primary absolute -top-2 -right-2 flex size-3.5 items-center justify-center rounded-full text-[10px] leading-none font-semibold">
                        {activeFilterCount}
                      </span>
                    ) : null}
                  </span>
                </Button>
              </DrawerTrigger>

              <DrawerContent className="max-h-[85vh] lg:h-full lg:max-h-none lg:w-104 lg:max-w-none lg:rounded-none">
                <DrawerHeader className="gap-1 text-left">
                  <DrawerTitle>Filters</DrawerTitle>
                  <DrawerDescription>Refine roadmap nodes by progress and type.</DrawerDescription>
                </DrawerHeader>

                <Separator />

                <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground text-xs font-medium">
                      {draftActiveFilterCount} active filters
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-muted-foreground text-xs font-medium">Status</span>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((option) => {
                        const isAll = option === 'ALL';
                        const isActive = isAll ? draftStatus === null : draftStatus === option;

                        return (
                          <Button
                            key={option}
                            size="sm"
                            variant={isActive ? 'default' : 'outline'}
                            className="h-8"
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => setDraftStatus(isAll ? null : option)}
                          >
                            {isAll ? 'All' : STATUS_LABELS[option]}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    <span className="text-muted-foreground text-xs font-medium">Node type</span>
                    <div className="flex flex-wrap gap-2">
                      {NODE_TYPE_OPTIONS.map((option) => {
                        const isAll = option === 'ALL';
                        const isActive = isAll ? draftNodeType === null : draftNodeType === option;

                        return (
                          <Button
                            key={option}
                            size="sm"
                            variant={isActive ? 'default' : 'outline'}
                            className="h-8"
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => setDraftNodeType(isAll ? null : option)}
                          >
                            {isAll ? 'All' : NODE_TYPE_LABELS[option]}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <DrawerFooter>
                  <Button type="button" onClick={applyDraftFilters}>
                    Apply Filter
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    disabled={draftActiveFilterCount === 0}
                    onClick={clearFiltersToAll}
                  >
                    Clear Filter
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
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
