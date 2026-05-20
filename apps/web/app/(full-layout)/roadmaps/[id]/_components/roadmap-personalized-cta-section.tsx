'use client';

import { ArrowRight, ArrowRight02FreeIcons } from '@hugeicons/core-free-icons';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { Button } from '@repo/design-system/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

import { MaskBackground } from '@/components/shared/mask-background';
import { RainbowBar } from '@/components/shared/rainbow-bar';

export function RoadmapPersonalizedCtaSection() {
  return (
    <section className="relative flex w-full items-center justify-center overflow-hidden bg-white py-20 sm:py-24 lg:py-32">
      <MaskBackground />
      <RainbowBar />

      <SectionContainer className="relative z-10 flex w-full flex-col items-center justify-center px-8">
        <div className="flex w-full max-w-300 flex-col items-center justify-between gap-10 p-0 sm:p-6 lg:flex-row">
          <div className="flex w-full max-w-136 flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <div className="flex flex-col gap-5">
              <h2 className="font-heading text-foreground text-[28.9px] leading-[39.75px] font-medium tracking-[-0.75px]">
                Personalized Roadmaps Powered by AI
              </h2>
              <p className="text-muted-foreground text-base leading-[28.5px] sm:text-[18.3px]">
                Share your current level and career target, then let RMap generate a personalized
                roadmap with the right topics, learning order, and milestones for your journey.
              </p>
            </div>

            <div className="flex h-1 w-full flex-col justify-end pt-4">
              <div className="block h-1 w-full bg-linear-to-r from-[#a39ac1] via-[#a39ac1]/35 via-10% to-transparent">
                <svg className="-mt-px fill-[#a39ac1]" width="6" height="3" viewBox="0 0 6 3">
                  <path d="M2.594 2.525A1.501 1.501 0 112.635.519c.274.295.665.479 1.098.479H6v1.004H3.733a1.5 1.5 0 00-1.108.489l-.017.02-.013.015-.001-.001z" />
                </svg>
              </div>
            </div>

            <Button
              size="lg"
              className="group/btn rounded-full px-5"
              render={<Link href={'/roadmaps/generate' as never} />}
            >
              Try now
              <AnimatedIconSwap icon={ArrowRight} hoverIcon={ArrowRight02FreeIcons} />
            </Button>
          </div>

          <div className="relative aspect-384/292 w-full max-w-96 shrink-0">
            <Image
              className="object-contain"
              src="/personalized-roadmap-ai.png"
              alt="AI-powered roadmap cards illustration"
              fill
              sizes="(max-width: 1024px) 100vw, 384px"
            />
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
