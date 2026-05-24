'use client';

import type { Variants } from 'framer-motion';

import {
  Alert02Icon,
  ArrowLeftIcon,
  CheckmarkCircle02Icon,
  Download01Icon,
  FireIcon,
  Refresh01Icon,
  SaveIcon,
  Share01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { Button } from '@repo/design-system/components/ui/button';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { useIsMobile } from '@/hooks/use-mobile';

import type { RoadmapProgressSummary } from '../_types/roadmap-progress.types';

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
      ease: [0.21, 0.47, 0.32, 0.98],
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');
const PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;

  return Math.min(100, Math.max(0, value));
}

function formatPercent(value: number): string {
  return `${PERCENT_FORMATTER.format(clampPercent(value))}%`;
}

function formatDayCount(days: number): string {
  return `${NUMBER_FORMATTER.format(days)} ${days === 1 ? 'day' : 'days'}`;
}

interface RoadmapHeroProps {
  description?: null | string;
  isLoading?: boolean;
  isProgressLoading?: boolean;
  loadErrorMessage?: null | string;
  onProgressRetry?: () => void;
  progressErrorMessage?: null | string;
  progressSummary?: null | RoadmapProgressSummary;
  title: string;
}

export function RoadmapHero({
  description,
  isLoading = false,
  isProgressLoading = false,
  loadErrorMessage,
  onProgressRetry,
  progressErrorMessage,
  progressSummary,
  title,
}: RoadmapHeroProps) {
  const isMobile = useIsMobile();
  const completionPct = progressSummary ? clampPercent(progressSummary.completionPct) : 0;
  const circleProgress = completionPct / 100;
  const heroDescription =
    description ??
    (loadErrorMessage
      ? 'Roadmap details are unavailable right now, but you can still inspect the roadmap nodes below.'
      : 'Loading roadmap details...');
  const heroActions = (
    <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:items-center">
      <Button variant="outline" size="icon" className="h-10 w-full shadow-sm sm:w-10">
        <HugeiconsIcon className="size-4" icon={SaveIcon} />
      </Button>
      <Button variant="outline" className="h-10 shadow-sm">
        {!isMobile && 'Download'}
        <HugeiconsIcon className="ml-2 size-4" icon={Download01Icon} />
      </Button>
      <Button variant="outline" size="icon" className="h-10 w-full shadow-sm sm:w-10">
        <HugeiconsIcon className="size-4" icon={Share01Icon} />
      </Button>
    </div>
  );

  return (
    <SectionContainer className="relative flex w-full flex-col justify-start pt-20 pb-6 sm:pt-24 sm:pb-8 lg:pt-32">
      <motion.div
        className="flex w-full flex-col gap-5 sm:gap-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Top Row */}
        <motion.div
          className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          variants={itemVariants}
        >
          <Link
            className="text-primary hover:text-primary-active group inline-flex items-center gap-2 self-start font-medium transition-all hover:-translate-x-1"
            href="/"
          >
            <div className="bg-primary/5 group-hover:bg-primary/10 flex size-8 items-center justify-center rounded-full transition-colors">
              <HugeiconsIcon className="size-4" icon={ArrowLeftIcon} />
            </div>
            <span>All Roadmaps</span>
          </Link>
          <div className="hidden sm:block">{heroActions}</div>
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <motion.h1
            className="text-heading text-2xl sm:text-4xl lg:text-[42px]"
            variants={itemVariants}
          >
            {isLoading ? 'Loading roadmap...' : title}
          </motion.h1>
          <motion.p
            className="text-subtitle max-w-full text-sm sm:text-base"
            variants={itemVariants}
          >
            {heroDescription}
          </motion.p>
          <div className="sm:hidden">{heroActions}</div>
        </div>

        {/* Progress Row */}
        <motion.div
          className="border-primary/10 bg-primary/5 flex w-full flex-col gap-4 rounded-lg border p-4 shadow-sm backdrop-blur-sm"
          variants={itemVariants}
        >
          {isProgressLoading ? (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Skeleton className="h-12 w-full sm:w-40" />
                <Skeleton className="h-12 w-full sm:w-40" />
              </div>
            </div>
          ) : progressErrorMessage || !progressSummary ? (
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
          ) : (
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

                <div className="grid gap-3 sm:grid-cols-2">
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
                  <HugeiconsIcon
                    className="text-destructive mt-0.5 size-4 shrink-0"
                    icon={Alert02Icon}
                  />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-foreground text-sm font-semibold">Timeline warning</span>
                    <span className="text-muted-foreground text-xs sm:text-sm">
                      {progressSummary.timelineWarning.message}
                    </span>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </motion.div>
      </motion.div>
    </SectionContainer>
  );
}
