'use client';

import { useCallback } from 'react';

import { HeroGradient } from '@/components/shared/hero-gradient';
import { MaskBackground } from '@/components/shared/mask-background';
import { RainbowBar } from '@/components/shared/rainbow-bar';

import { useRoadmapDetail } from '../_hooks/use-roadmap-detail';
import { useRoadmapProgressSummary } from '../_hooks/use-roadmap-progress-summary';
import { RoadmapGraph } from './roadmap-graph';
import { RoadmapHero } from './roadmap-hero';
import { RoadmapPersonalizedCtaSection } from './roadmap-personalized-cta-section';

interface RoadmapDetailContentProps {
  roadmapId: string;
}

export function RoadmapDetailContent({ roadmapId }: RoadmapDetailContentProps) {
  const { errorMessage, isLoading, roadmap } = useRoadmapDetail({ roadmapId });
  const {
    errorMessage: progressErrorMessage,
    isLoading: isProgressLoading,
    refreshProgressSummary,
    summary: progressSummary,
  } = useRoadmapProgressSummary({ roadmapId });
  const title = roadmap?.title ?? 'Roadmap';
  const handleProgressUpdated = useCallback(() => {
    void refreshProgressSummary();
  }, [refreshProgressSummary]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-start overflow-x-hidden">
      <MaskBackground />
      <HeroGradient />
      <RainbowBar />

      <RoadmapHero
        title={title}
        description={roadmap?.description}
        isLoading={isLoading}
        loadErrorMessage={errorMessage}
        progressErrorMessage={progressErrorMessage}
        progressSummary={progressSummary}
        isProgressLoading={isProgressLoading}
        onProgressRetry={handleProgressUpdated}
      />
      <RoadmapGraph
        roadmapId={roadmapId}
        roadmapTitle={title}
        onProgressUpdated={handleProgressUpdated}
      />
      <RoadmapPersonalizedCtaSection />
    </main>
  );
}
