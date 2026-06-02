'use client';

import { useCallback, useState } from 'react';

import { HeroGradient } from '@/components/shared/hero-gradient';
import { MaskBackground } from '@/components/shared/mask-background';
import { RainbowBar } from '@/components/shared/rainbow-bar';
import { useAuth } from '@/hooks/use-auth';

import { useRoadmapActions } from '../_hooks/use-roadmap-actions';
import { useRoadmapDetail } from '../_hooks/use-roadmap-detail';
import { useRoadmapProgressSummary } from '../_hooks/use-roadmap-progress-summary';
import { RoadmapGraph } from './roadmap-graph';
import { RoadmapHero } from './roadmap-hero';
import { RoadmapPersonalizedCtaSection } from './roadmap-personalized-cta-section';

interface RoadmapDetailContentProps {
  roadmapId: string;
}

export function RoadmapDetailContent({ roadmapId }: RoadmapDetailContentProps) {
  const { isAuthenticated } = useAuth();
  const [graphRefreshKey, setGraphRefreshKey] = useState(0);
  const { errorMessage, isLoading, mode, refreshRoadmapDetail, roadmap } = useRoadmapDetail({
    isAuthenticated,
    roadmapId,
  });
  const isPersonalRoadmap = Boolean(isAuthenticated && mode === 'personal' && roadmap);
  const {
    errorMessage: progressErrorMessage,
    isLoading: isProgressLoading,
    refreshProgressSummary,
    summary: progressSummary,
  } = useRoadmapProgressSummary({ enabled: isPersonalRoadmap, roadmapId });

  const { isRecreatingRoadmap, isStartingLearning, handleStartLearning, handleRecreateRoadmap } =
    useRoadmapActions({
      roadmapId,
      refreshRoadmapDetail,
      refreshProgressSummary,
      onGraphRefreshNeeded: () => setGraphRefreshKey((current) => current + 1),
    });

  const title = roadmap?.title ?? 'Roadmap';
  const isPreviewRoadmap = Boolean(isPersonalRoadmap && roadmap && !roadmap.startedAt);

  const handleProgressUpdated = useCallback(() => {
    if (!isPersonalRoadmap) return;

    void refreshProgressSummary();
  }, [isPersonalRoadmap, refreshProgressSummary]);

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
        showPreviewActions={isPreviewRoadmap}
        showProgress={isPersonalRoadmap}
        canRecreate={isPersonalRoadmap}
        isRecreatingRoadmap={isRecreatingRoadmap}
        isStartingLearning={isStartingLearning}
        onRecreateRoadmap={handleRecreateRoadmap}
        onStartLearning={handleStartLearning}
      />
      <RoadmapGraph
        key={graphRefreshKey}
        isPersonalRoadmap={isPersonalRoadmap}
        mode={mode}
        roadmapId={roadmapId}
        roadmapTitle={title}
        onProgressUpdated={handleProgressUpdated}
      />
      <RoadmapPersonalizedCtaSection />
    </main>
  );
}
