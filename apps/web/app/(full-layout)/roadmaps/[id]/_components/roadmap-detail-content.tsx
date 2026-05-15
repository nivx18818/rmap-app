'use client';

import { HeroGradient } from '@/components/shared/hero-gradient';
import { MaskBackground } from '@/components/shared/mask-background';
import { RainbowBar } from '@/components/shared/rainbow-bar';

import { useRoadmapDetail } from '../_hooks/use-roadmap-detail';
import { RoadmapGraph } from './roadmap-graph';
import { RoadmapHero } from './roadmap-hero';

interface RoadmapDetailContentProps {
  roadmapId: string;
}

export function RoadmapDetailContent({ roadmapId }: RoadmapDetailContentProps) {
  const { errorMessage, isLoading, roadmap } = useRoadmapDetail({ roadmapId });
  const title = roadmap?.title ?? 'Roadmap';

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
      />
      <RoadmapGraph roadmapId={roadmapId} roadmapTitle={title} />
    </main>
  );
}
