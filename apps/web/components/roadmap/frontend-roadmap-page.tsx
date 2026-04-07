import { ArrowRight, ArrowRight02FreeIcons } from '@hugeicons/core-free-icons';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { Button } from '@repo/design-system/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

import type { RoadmapRoot } from '@/types/roadmap';

import { RoadmapGraph } from './roadmap-graph';
import { RoadmapHero } from './roadmap-hero';
import { RoadmapIntroCard } from './roadmap-intro-card';

interface FrontendRoadmapPageProps {
  roadmap: RoadmapRoot;
}

export function FrontendRoadmapPage({ roadmap }: FrontendRoadmapPageProps) {
  const nodes = roadmap.roadmaps.nodes;

  return (
    <main className="overflow-hidden bg-white pt-28">
      <section className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_45%_0%,rgba(244,208,252,0.24),transparent_34%),radial-gradient(circle_at_100%_0%,rgba(186,230,253,0.18),transparent_24%),radial-gradient(circle_at_0%_0%,rgba(254,240,138,0.08),transparent_18%)]" />

        <SectionContainer className="relative flex flex-col gap-4 pt-[34px] pb-16 lg:pb-20">
          <RoadmapHero title={roadmap.roadmaps.title} />
          <RoadmapIntroCard />
        </SectionContainer>
      </section>

      <section className="relative pb-20 lg:pb-28">
        <SectionContainer className="relative">
          <RoadmapGraph nodes={nodes} />
        </SectionContainer>
      </section>

      <section className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(244,232,255,0.35),rgba(255,255,255,0.92))] py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-20 max-w-[1480px] rotate-[-3deg] bg-[linear-gradient(90deg,rgba(125,211,252,0.35),rgba(165,180,252,0.45),rgba(249,168,212,0.35))] blur-3xl" />

        <SectionContainer className="relative">
          <div className="grid items-center gap-10 rounded-[28px] border border-white/70 bg-white/70 px-6 py-8 shadow-[0_24px_80px_rgba(31,27,62,0.06)] backdrop-blur-sm lg:grid-cols-[0.95fr_0.65fr] lg:px-10 lg:py-10">
            <div className="space-y-5">
              <h2 className="font-heading text-[2rem] leading-[1.05] font-medium tracking-[-0.05em] text-[#231535] lg:text-[2.4rem]">
                Personalized Roadmaps Powered by AI
              </h2>
              <p className="max-w-xl text-base leading-7 text-[#6c5a84]">
                Turn the static roadmap into a guided plan. Use the same frontend graph as your
                baseline, then personalize it for your current skill level, preferred framework, and
                target role.
              </p>
              <Button size="lg" className="group/btn rounded-full" render={<Link href="/" />}>
                Try now
                <AnimatedIconSwap icon={ArrowRight} hoverIcon={ArrowRight02FreeIcons} />
              </Button>
            </div>

            <div className="relative mx-auto h-64 w-full max-w-[380px]">
              <Image
                className="object-contain drop-shadow-[0_20px_30px_rgba(124,58,237,0.18)]"
                fill
                src="/ai-bird-laptop.png"
                alt="AI assistant illustration"
                sizes="(max-width: 1024px) 320px, 380px"
              />
            </div>
          </div>
        </SectionContainer>
      </section>
    </main>
  );
}
