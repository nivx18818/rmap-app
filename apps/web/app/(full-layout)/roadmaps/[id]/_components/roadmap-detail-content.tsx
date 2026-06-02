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
  const isAuthenticatedRoadmapView = Boolean(
    isAuthenticated && mode === 'authenticated' && roadmap,
  );
  const isPublicTemplatePreview = Boolean(!isAuthenticated && mode === 'template');
  const {
    errorMessage: progressErrorMessage,
    isLoading: isProgressLoading,
    refreshProgressSummary,
    summary: progressSummary,
  } = useRoadmapProgressSummary({ enabled: isAuthenticatedRoadmapView, roadmapId });

  const { isRecreatingRoadmap, isStartingLearning, handleStartLearning, handleRecreateRoadmap } =
    useRoadmapActions({
      roadmapId,
      refreshRoadmapDetail,
      refreshProgressSummary,
      onGraphRefreshNeeded: () => setGraphRefreshKey((current) => current + 1),
    });

  const title = roadmap?.title ?? 'Roadmap';
  const canStartLearning = Boolean(isAuthenticatedRoadmapView && roadmap && !roadmap.startedAt);
  const canRecreate = Boolean(isAuthenticatedRoadmapView && roadmap && !roadmap.isTemplate);

  const handleProgressUpdated = useCallback(() => {
    if (!isAuthenticatedRoadmapView) return;

    void refreshProgressSummary();
  }, [isAuthenticatedRoadmapView, refreshProgressSummary]);

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
        showPreviewActions={canStartLearning}
        showProgress={!isPublicTemplatePreview && isAuthenticatedRoadmapView}
        canRecreate={canRecreate}
        isRecreatingRoadmap={isRecreatingRoadmap}
        isStartingLearning={isStartingLearning}
        onRecreateRoadmap={handleRecreateRoadmap}
        onStartLearning={handleStartLearning}
      />
      <RoadmapGraph
        key={graphRefreshKey}
        isAuthenticatedRoadmapView={isAuthenticatedRoadmapView}
        mode={mode}
        roadmapId={roadmapId}
        roadmapTitle={title}
        onProgressUpdated={handleProgressUpdated}
      />
      <RoadmapPersonalizedCtaSection />
    </main>
  );
}
