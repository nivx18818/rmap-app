'use client';

import {
  Alert02Icon,
  ArrowRight02FreeIcons,
  Search01Icon,
  ToggleOnIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/design-system/components/ui/drawer';
import { Input } from '@repo/design-system/components/ui/input';
import { cn } from '@repo/design-system/lib/utils';
import { useState } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';

import type { DashboardActiveRoadmap } from '../../_types/dashboard.types';

import { useRoadmapSearch, matchesActiveRoadmapSearch } from '../../_hooks/use-roadmap-search';
import { clampPercent, formatRoleCategory } from '../../_utils/formatters';

interface ActiveRoadmapsDrawerProps {
  onSelectRoadmap: (roadmapId: string) => void;
  roadmaps: DashboardActiveRoadmap[];
  selectedRoadmapId: null | string;
}

export function ActiveRoadmapsDrawer({
  onSelectRoadmap,
  roadmaps,
  selectedRoadmapId,
}: ActiveRoadmapsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { searchQuery, setSearchQuery, filteredRoadmaps } = useRoadmapSearch(
    roadmaps,
    matchesActiveRoadmapSearch,
  );
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? 'bottom' : 'right'} open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="group/btn flex-1" type="button">
          Active Roadmaps
          <AnimatedIconSwap
            className="opacity-100"
            icon={ToggleOnIcon}
            hoverIcon={ArrowRight02FreeIcons}
          />
        </Button>
      </DrawerTrigger>
      <DrawerContent className={cn('w-[min(92vw,520px)] sm:max-w-130', isMobile && 'w-full!')}>
        <DrawerHeader className="border-border/70 border-b">
          <DrawerTitle>My active roadmaps</DrawerTitle>
          <DrawerDescription>
            Search and switch the roadmap used across the dashboard.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
          <div className="relative">
            <HugeiconsIcon
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              icon={Search01Icon}
            />
            <Input
              className="pl-9"
              placeholder="Search active roadmaps"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          {filteredRoadmaps.length === 0 ? (
            <div className="bg-primary/5 flex flex-col gap-2 rounded-md p-4">
              <span className="text-foreground text-sm font-semibold">No roadmaps found</span>
              <span className="text-muted-foreground text-sm leading-5">
                Try a different keyword.
              </span>
            </div>
          ) : (
            <div className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1">
              {filteredRoadmaps.map((activeRoadmap) => {
                const isSelected = Boolean(
                  selectedRoadmapId && activeRoadmap.roadmapId === selectedRoadmapId,
                );

                return (
                  <button
                    key={activeRoadmap.roadmapId}
                    className={cn(
                      'hover:bg-primary/5 focus-visible:ring-ring flex w-full flex-col gap-3 rounded-md border p-4 text-left transition-colors focus-visible:ring-[3px] focus-visible:outline-none',
                      isSelected
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-border/70 bg-background/60',
                    )}
                    type="button"
                    onClick={() => {
                      onSelectRoadmap(activeRoadmap.roadmapId);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="text-foreground line-clamp-2 text-sm font-semibold">
                          {activeRoadmap.title}
                        </span>
                        <span className="text-muted-foreground truncate text-sm">
                          {formatRoleCategory(activeRoadmap.roleCategory)}
                        </span>
                      </div>
                      {activeRoadmap.timelineWarning?.isBehind ? (
                        <HugeiconsIcon
                          className="text-destructive mt-0.5 size-4 shrink-0"
                          icon={Alert02Icon}
                        />
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">
                        {activeRoadmap.nodesCompleted} / {activeRoadmap.nodesTotal} nodes
                      </span>
                      <span className="text-foreground font-semibold">
                        {clampPercent(activeRoadmap.completionPct)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
