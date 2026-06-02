'use client';

import { FilterVerticalIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
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
import { Separator } from '@repo/design-system/components/ui/separator';
import { useEffect, useState } from 'react';

import type { NodeType, ProgressStatus } from '../_types/roadmap-node.types';

import {
  NODE_TYPE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from '../_constants/roadmap-filter.constants';
import { NODE_TYPE_LABELS, STATUS_LABELS } from '../_constants/roadmap-node.constants';
import { useResponsiveDrawerDirection } from '../_hooks/use-responsive-drawer-direction';

interface RoadmapFilterDrawerProps {
  canFilterByStatus?: boolean;
  nodeType: NodeType | null;
  onNodeTypeChange: (nodeType: NodeType | null) => void;
  onStatusChange: (status: ProgressStatus | null) => void;
  status: ProgressStatus | null;
}

export function RoadmapFilterDrawer({
  canFilterByStatus = true,
  nodeType,
  onNodeTypeChange,
  onStatusChange,
  status,
}: RoadmapFilterDrawerProps) {
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const drawerDirection = useResponsiveDrawerDirection();
  const [draftNodeType, setDraftNodeType] = useState(nodeType);
  const [draftStatus, setDraftStatus] = useState(status);
  const activeFilterCount =
    (canFilterByStatus && status !== null ? 1 : 0) + (nodeType === null ? 0 : 1);
  const draftActiveFilterCount =
    (canFilterByStatus && draftStatus !== null ? 1 : 0) + (draftNodeType === null ? 0 : 1);
  const hasActiveFilters = activeFilterCount > 0;

  const applyDraftFilters = () => {
    if (canFilterByStatus && draftStatus !== status) {
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
    if (canFilterByStatus) {
      onStatusChange(null);
    }
    onNodeTypeChange(null);
    setIsFilterDrawerOpen(false);
  };

  useEffect(() => {
    if (!isFilterDrawerOpen) return;

    setDraftNodeType(nodeType);
    setDraftStatus(status);
  }, [isFilterDrawerOpen, nodeType, status]);

  return (
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
          <DrawerDescription>
            {canFilterByStatus
              ? 'Refine roadmap nodes by progress and type.'
              : 'Refine roadmap nodes by type.'}
          </DrawerDescription>
        </DrawerHeader>

        <Separator />

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-xs font-medium">
              {draftActiveFilterCount} active filters
            </span>
          </div>

          {canFilterByStatus ? (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs font-medium">Status</span>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTER_OPTIONS.map((option) => {
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
            </>
          ) : null}

          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-medium">Node type</span>
            <div className="flex flex-wrap gap-2">
              {NODE_TYPE_FILTER_OPTIONS.map((option) => {
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
  );
}
