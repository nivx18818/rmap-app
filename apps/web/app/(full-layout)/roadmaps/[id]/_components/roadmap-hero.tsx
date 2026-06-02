'use client';

import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { motion } from 'framer-motion';

import type { RoadmapProgressSummary } from '../_types/roadmap-progress.types';

import { containerVariants, itemVariants } from '../_utils/roadmap-hero-utils';
import { HeroActions } from './roadmap-hero-actions';
import { HeroHeader } from './roadmap-hero-header';
import { HeroProgress } from './roadmap-hero-progress';

export interface RoadmapHeroProps {
  canRecreate?: boolean;
  description?: null | string;
  isLoading?: boolean;
  isProgressLoading?: boolean;
  isRecreatingRoadmap?: boolean;
  isStartingLearning?: boolean;
  loadErrorMessage?: null | string;
  onProgressRetry?: () => void;
  onRecreateRoadmap?: () => void;
  onStartLearning?: () => void;
  progressErrorMessage?: null | string;
  progressSummary?: null | RoadmapProgressSummary;
  showPreviewActions?: boolean;
  showProgress?: boolean;
  title: string;
}

export function RoadmapHero({
  canRecreate = false,
  description,
  isLoading = false,
  isProgressLoading = false,
  isRecreatingRoadmap = false,
  isStartingLearning = false,
  loadErrorMessage,
  onProgressRetry,
  onRecreateRoadmap,
  onStartLearning,
  progressErrorMessage,
  progressSummary,
  showPreviewActions = false,
  showProgress = true,
  title,
}: RoadmapHeroProps) {
  const isActionBusy = isRecreatingRoadmap || isStartingLearning;
  const actionMode = showPreviewActions
    ? 'preview'
    : isLoading && !loadErrorMessage
      ? 'loading'
      : 'default';

  const heroDescription =
    description ??
    (loadErrorMessage
      ? 'Roadmap details are unavailable right now, but you can still inspect the roadmap nodes below.'
      : 'Loading roadmap details...');

  const heroActions = (
    <HeroActions
      actionMode={actionMode}
      canRecreate={canRecreate}
      isActionBusy={isActionBusy}
      isRecreatingRoadmap={isRecreatingRoadmap}
      isStartingLearning={isStartingLearning}
      onRecreateRoadmap={onRecreateRoadmap}
      onStartLearning={onStartLearning}
    />
  );

  return (
    <SectionContainer className="relative flex w-full flex-col justify-start pt-20 pb-6 sm:pt-24 sm:pb-8 lg:pt-32">
      <motion.div
        className="flex w-full flex-col gap-5 sm:gap-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <HeroHeader
          title={title}
          heroActions={heroActions}
          heroDescription={heroDescription}
          isLoading={isLoading}
        />

        {showProgress ? (
          <motion.div
            className="border-primary/10 bg-primary/5 flex w-full flex-col gap-4 rounded-lg border p-4 shadow-sm backdrop-blur-sm"
            variants={itemVariants}
          >
            <HeroProgress
              isProgressLoading={isProgressLoading}
              onProgressRetry={onProgressRetry}
              progressErrorMessage={progressErrorMessage}
              progressSummary={progressSummary}
            />
          </motion.div>
        ) : null}
      </motion.div>
    </SectionContainer>
  );
}
