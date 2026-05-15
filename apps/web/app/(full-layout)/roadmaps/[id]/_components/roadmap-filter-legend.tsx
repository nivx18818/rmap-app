'use client';

import {
  CircleLock01Icon,
  InformationCircleIcon,
  MedalFirstPlaceIcon,
  Progress02Icon,
  Tick04Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/design-system/components/ui/drawer';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@repo/design-system/components/ui/hover-card';
import { useState } from 'react';

import type { RoadmapDisplayMode } from '../_types/roadmap-display-mode.types';

import { MilestoneMarker, SkillCheckMarker } from './roadmap-flow-markers';

function LegendItem({
  description,
  icon,
  label,
}: {
  description: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="border-border/80 bg-muted/20 flex items-center gap-3 rounded-md border px-3 py-2">
      {icon}
      <div className="flex min-w-0 flex-col">
        <span className="text-foreground text-sm font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">{description}</span>
      </div>
    </div>
  );
}

function SkillTreeLegendContent() {
  const legendItems = [
    {
      description: 'Core skill marker',
      icon: <SkillCheckMarker size="md" nodeType="REQUIRED" position="static" />,
      label: 'Required',
    },
    {
      description: 'Optional skill marker',
      icon: <SkillCheckMarker size="md" nodeType="OPTIONAL" position="static" />,
      label: 'Optional',
    },
    {
      description: 'Milestone marker',
      icon: <MilestoneMarker position="static" status="IN_PROGRESS" />,
      label: 'Milestone',
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {legendItems.map((item) => (
        <LegendItem
          key={item.label}
          label={item.label}
          description={item.description}
          icon={item.icon}
        />
      ))}
    </div>
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
        <LegendItem
          key={item.label}
          label={item.label}
          description={item.description}
          icon={item.icon}
        />
      ))}
    </div>
  );
}

function LegendControl({
  children,
  description,
  drawerOpen,
  drawerTitle,
  hoverWidth,
  onDrawerOpenChange,
  triggerLabel,
}: {
  children: React.ReactNode;
  description: string;
  drawerOpen: boolean;
  drawerTitle: string;
  hoverWidth: string;
  onDrawerOpenChange: (isOpen: boolean) => void;
  triggerLabel: string;
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
              aria-label={triggerLabel}
            >
              <HugeiconsIcon data-icon="inline-start" icon={InformationCircleIcon} />
            </Button>
          }
        />
        <HoverCardContent className={`${hoverWidth} p-3`} side="right" align="start">
          <div className="mb-3 flex flex-col gap-1">
            <h3 className="text-foreground text-sm font-semibold">{drawerTitle}</h3>
            <p className="text-muted-foreground text-xs">{description}</p>
          </div>
          {children}
        </HoverCardContent>
      </HoverCard>

      <Drawer direction="bottom" open={drawerOpen} onOpenChange={onDrawerOpenChange}>
        <DrawerTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className="lg:hidden"
            type="button"
            aria-label={triggerLabel.replace('Show', 'Open')}
          >
            <HugeiconsIcon data-icon="inline-start" icon={InformationCircleIcon} />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{drawerTitle}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">{children}</div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export function RoadmapFilterLegend({ displayMode }: { displayMode: RoadmapDisplayMode }) {
  const [isSkillTreeLegendOpen, setIsSkillTreeLegendOpen] = useState(false);
  const [isStackListLegendOpen, setIsStackListLegendOpen] = useState(false);

  if (displayMode === 'skill-tree') {
    return (
      <LegendControl
        description="Icon markers used on the roadmap graph."
        drawerOpen={isSkillTreeLegendOpen}
        drawerTitle="Skill Tree Legend"
        hoverWidth="w-72"
        onDrawerOpenChange={setIsSkillTreeLegendOpen}
        triggerLabel="Show skill tree legend"
      >
        <SkillTreeLegendContent />
      </LegendControl>
    );
  }

  return (
    <LegendControl
      description="Status icons used in stack list groups."
      drawerOpen={isStackListLegendOpen}
      drawerTitle="Stack List Legend"
      hoverWidth="w-80"
      onDrawerOpenChange={setIsStackListLegendOpen}
      triggerLabel="Show stack list legend"
    >
      <StackListLegendContent />
    </LegendControl>
  );
}
