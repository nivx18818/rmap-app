'use client';

import type { Route } from 'next';

import {
  CheckmarkCircle02Icon,
  Alert01Icon,
  ArrowRight,
  RefreshIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button, buttonVariants } from '@repo/design-system/components/ui/button';
import { cn } from '@repo/design-system/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { type TimelineWarning } from '@/app/(full-layout)/roadmaps/generate/_types/onboarding';
import { buildRoadmapHref } from '@/utils/roadmap-url';

interface GenerationSuccessProps {
  generatedRoadmapId?: string;
  generatedRoadmapTitle?: string;
  timelineWarning?: TimelineWarning;
  onRecreate: () => void;
}

export function GenerationSuccess({
  generatedRoadmapId,
  generatedRoadmapTitle,
  timelineWarning,
  onRecreate,
}: GenerationSuccessProps) {
  const roadmapHref = generatedRoadmapId
    ? (buildRoadmapHref({
        id: generatedRoadmapId,
        title: generatedRoadmapTitle,
      }) as Route<string>)
    : null;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <motion.div
        className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 shadow-sm"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
      >
        <HugeiconsIcon className="size-10" icon={CheckmarkCircle02Icon} />
      </motion.div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h2 className="text-foreground mt-8 text-2xl font-semibold tracking-tight sm:text-3xl">
          Roadmap Generated Successfully!
        </h2>
        <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
          {timelineWarning
            ? "We've built your learning path, but it looks like you might need more time to finish it."
            : "We've built your personalized learning path. Redirecting you to your roadmap now..."}
        </p>

        {timelineWarning && (
          <>
            <motion.div
              className="mx-auto mt-10 flex flex-col items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50/50 p-6 text-center shadow-sm backdrop-blur-sm lg:max-w-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <HugeiconsIcon className="size-5" icon={Alert01Icon} />
              </div>
              <div className="flex flex-col items-center">
                <h4 className="text-sm font-semibold text-orange-900">
                  Timeline Adjustment Needed
                </h4>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-orange-800/80">
                  {timelineWarning.message}
                </p>
              </div>
            </motion.div>

            <motion.div
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={onRecreate}>
                <HugeiconsIcon className="mr-2 size-4" icon={RefreshIcon} />
                Recreate Roadmap
              </Button>
              {roadmapHref ? (
                <Link
                  className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto')}
                  href={roadmapHref}
                >
                  View Roadmap
                  <HugeiconsIcon className="ml-2 size-4" icon={ArrowRight} />
                </Link>
              ) : null}
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
