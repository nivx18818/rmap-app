import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  FireIcon,
  Refresh01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { motion } from 'framer-motion';

import type { RoadmapProgressSummary } from '../_types/roadmap-progress.types';

import {
  clampPercent,
  formatDayCount,
  formatPercent,
  NUMBER_FORMATTER,
} from '../_utils/roadmap-hero-utils';

export interface HeroProgressProps {
  isProgressLoading: boolean;
  onProgressRetry?: () => void;
  progressErrorMessage?: null | string;
  progressSummary?: null | RoadmapProgressSummary;
}

export function HeroProgress({
  isProgressLoading,
  onProgressRetry,
  progressErrorMessage,
  progressSummary,
}: HeroProgressProps) {
  if (isProgressLoading) {
    return (
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12 w-full sm:w-40" />
          <Skeleton className="h-12 w-full sm:w-40" />
        </div>
      </div>
    );
  }

  if (progressErrorMessage || !progressSummary) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-destructive/10 text-destructive flex size-12 shrink-0 items-center justify-center rounded-full">
            <HugeiconsIcon className="size-5" icon={Alert02Icon} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-foreground text-sm font-semibold sm:text-base">
              Progress unavailable
            </span>
            <span className="text-muted-foreground text-xs sm:text-sm">
              {progressErrorMessage ?? 'Roadmap progress could not be loaded.'}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="text-primary hover:bg-primary/10 h-10 w-full font-semibold shadow-sm sm:w-auto"
          type="button"
          onClick={onProgressRetry}
        >
          <HugeiconsIcon data-icon="inline-start" icon={Refresh01Icon} />
          Retry
        </Button>
      </div>
    );
  }

  const completionPct = clampPercent(progressSummary.completionPct);
  const circleProgress = completionPct / 100;

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative flex size-14 shrink-0 items-center justify-center">
            <svg
              className="size-full"
              aria-label={`${formatPercent(completionPct)} roadmap completion`}
              viewBox="0 0 36 36"
            >
              <path
                className="stroke-primary/10"
                fill="none"
                strokeWidth="3"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <motion.path
                className="stroke-primary"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: circleProgress }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeWidth="3"
                strokeDasharray="100, 100"
                strokeLinecap="round"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="text-primary absolute text-[10px] font-bold">
              {formatPercent(completionPct)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-foreground text-sm font-semibold sm:text-base">
              {formatPercent(progressSummary.completionPct)} complete
            </span>
            <span className="text-muted-foreground text-xs sm:text-sm">
              {NUMBER_FORMATTER.format(progressSummary.nodesCompleted)} /{' '}
              {NUMBER_FORMATTER.format(progressSummary.nodesTotal)} nodes completed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-background/80 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
              <HugeiconsIcon className="size-4" icon={FireIcon} />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-foreground text-sm font-semibold">
                {formatDayCount(progressSummary.streakDays)}
              </span>
              <span className="text-muted-foreground text-xs">Streak</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-background/80 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
              <HugeiconsIcon className="size-4" icon={CheckmarkCircle02Icon} />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-foreground text-sm font-semibold">
                {formatPercent(progressSummary.skillReadinessPct)}
              </span>
              <span className="text-muted-foreground text-xs">Skill readiness</span>
            </div>
          </div>
        </div>
      </div>

      {progressSummary.timelineWarning ? (
        <div className="border-destructive/30 bg-destructive/10 flex gap-3 rounded-md border p-3">
          <HugeiconsIcon className="text-destructive mt-0.5 size-4 shrink-0" icon={Alert02Icon} />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-foreground text-sm font-semibold">Timeline warning</span>
            <span className="text-muted-foreground text-xs sm:text-sm">
              {progressSummary.timelineWarning.message}
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}
