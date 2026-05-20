'use client';

import { ListChevronsDownUpIcon, ListTreeIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/design-system/components/ui/tooltip';
import { cn } from '@repo/design-system/lib/utils';

import type { RoadmapDisplayMode } from '../_types/roadmap-display-mode.types';

interface RoadmapDisplayModeSwitchProps {
  onChange: (value: RoadmapDisplayMode) => void;
  value: RoadmapDisplayMode;
}

export function RoadmapDisplayModeSwitch({ onChange, value }: RoadmapDisplayModeSwitchProps) {
  const options: Array<{
    icon: typeof ListTreeIcon;
    tooltip: string;
    value: RoadmapDisplayMode;
  }> = [
    {
      icon: ListTreeIcon,
      tooltip: 'Skill Tree Display Mode',
      value: 'skill-tree',
    },
    {
      icon: ListChevronsDownUpIcon,
      tooltip: 'Stack List Display Mode',
      value: 'stack-list',
    },
  ];

  return (
    <div
      className="bg-muted/70 border-border/60 inline-flex h-10 w-fit items-center gap-1 rounded-md border p-1 shadow-sm backdrop-blur-sm"
      aria-label="Roadmap display mode"
    >
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <Tooltip key={option.value}>
            <TooltipTrigger
              render={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className={cn(
                    'relative rounded-md transition-all duration-200 [&_svg]:size-5!',
                    'text-muted-foreground hover:text-foreground hover:bg-background/80',
                    isActive &&
                      'bg-background text-foreground border-border/70 hover:bg-background border shadow-sm',
                  )}
                  type="button"
                  aria-label={option.tooltip}
                  aria-pressed={isActive}
                  onClick={() => onChange(option.value)}
                >
                  <HugeiconsIcon icon={option.icon} />
                  <span className="sr-only">{option.tooltip}</span>
                </Button>
              }
            />
            <TooltipContent side="top">{option.tooltip}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
