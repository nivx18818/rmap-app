import { SectionContainer } from '@repo/design-system/components/common/section-container';
import Image from 'next/image';
import { Suspense } from 'react';

import { MaskBackground } from '@/components/shared/mask-background';
import { RainbowBar } from '@/components/shared/rainbow-bar';

import { RoadmapFeaturedTemplatesLoader } from './roadmap-featured-templates-loader';
import { RoadmapFeaturedTemplatesSkeleton } from './roadmap-featured-templates-skeleton';

export function RoadmapSection() {
  return (
    <section className="relative flex flex-col items-center overflow-hidden bg-[linear-gradient(180deg,#eef7ff_0%,#f7f2ff_54%,#fff7fb_100%)] pt-24 pb-32">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_8%,rgba(255,255,255,0.95),transparent_34%),radial-gradient(circle_at_84%_18%,rgba(255,255,255,0.72),transparent_30%)]"
        aria-hidden="true"
      />
      <RainbowBar />

      <MaskBackground />

      <SectionContainer className="relative z-10 flex flex-col items-center justify-center gap-16">
        <div className="flex w-full flex-col items-center justify-between gap-8 lg:flex-row lg:items-end lg:gap-12">
          <div className="flex w-full max-w-134 flex-col gap-6 text-left">
            <h2 className="text-title">
              Discover Learning Roadmaps,
              <br /> Master Any Technology.
            </h2>
            <p className="text-subtitle">
              RMap helps you turn career goals into clear learning steps. Explore role-based and
              skill-based roadmaps, discover what to learn next, and build momentum with a
              personalized path.
            </p>

            <div className="flex h-1 w-full flex-col justify-end pt-4">
              <div className="block h-1 w-full bg-linear-to-r from-[#a39ac1] via-[#a39ac1]/35 via-10% to-transparent">
                <svg className="-mt-px fill-[#a39ac1]" width="6" height="3" viewBox="0 0 6 3">
                  <path d="M2.594 2.525A1.501 1.501 0 112.635.519c.274.295.665.479 1.098.479H6v1.004H3.733a1.5 1.5 0 00-1.108.489l-.017.02-.013.015-.001-.001z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="relative aspect-square w-full max-w-72 shrink-0 lg:max-w-96">
            <Image
              className="object-contain"
              src="/roadmap-globe.png"
              alt="Globe with hot air balloons"
              fill
              priority
              sizes="384px"
            />
          </div>
        </div>

        <Suspense fallback={<RoadmapFeaturedTemplatesSkeleton />}>
          <RoadmapFeaturedTemplatesLoader />
        </Suspense>
      </SectionContainer>
    </section>
  );
}
