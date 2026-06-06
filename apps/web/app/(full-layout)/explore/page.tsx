import type { Metadata } from 'next';

import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { Suspense } from 'react';

import { HeroGradient } from '@/components/shared/hero-gradient';
import { MaskBackground } from '@/components/shared/mask-background';
import { RainbowBar } from '@/components/shared/rainbow-bar';

import { RoadmapTemplatesLoader } from '../(home)/_components/roadmap-templates-loader';
import { RoadmapTemplatesSkeleton } from '../(home)/_components/roadmap-templates-skeleton';

export const metadata: Metadata = {
  title: 'Explore Roadmaps | RMap',
  description: 'Browse role-based and skill-based roadmap templates for your learning journey.',
};

export default function ExploreRoadmapsPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[linear-gradient(180deg,#eef7ff_0%,#f7f2ff_54%,#fff7fb_100%)] pt-32 pb-32">
      <HeroGradient />
      <RainbowBar />
      <MaskBackground />

      <SectionContainer className="relative z-10 flex flex-col items-center justify-center gap-12">
        <div className="flex w-full max-w-180 flex-col items-center gap-5 text-center">
          <h1 className="text-title">Explore Learning Roadmaps</h1>
          <p className="text-subtitle">
            Browse every roadmap template, filter by category, and find the path that matches your
            next learning goal.
          </p>
        </div>

        <Suspense fallback={<RoadmapTemplatesSkeleton />}>
          <RoadmapTemplatesLoader />
        </Suspense>
      </SectionContainer>
    </main>
  );
}
