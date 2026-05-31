import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { Suspense } from 'react';

import { MaskBackground } from '@/components/shared/mask-background';
import { RainbowBar } from '@/components/shared/rainbow-bar';

import { RoadmapTemplatesLoader } from './roadmap-templates-loader';
import { RoadmapTemplatesSkeleton } from './roadmap-templates-skeleton';

export function RoadmapSection() {
  return (
    <section className="bg-background relative flex flex-col items-center overflow-hidden pt-20 pb-24 sm:pt-24 sm:pb-32 lg:pt-32">
      <RainbowBar />

      <MaskBackground />

      <SectionContainer className="relative z-10 flex flex-col items-center justify-center">
        <Suspense fallback={<RoadmapTemplatesSkeleton />}>
          <RoadmapTemplatesLoader />
        </Suspense>
      </SectionContainer>
    </section>
  );
}
