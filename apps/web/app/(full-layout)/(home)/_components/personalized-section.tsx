import {
  ArrowRight,
  ArrowRight02FreeIcons,
  Location01Icon,
  Tick01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { Button } from '@repo/design-system/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

import { MaskBackground } from '@/components/shared/mask-background';
import { RainbowBar } from '@/components/shared/rainbow-bar';

const NOTEBOOK_ITEMS = [
  { label: 'Road to DevOps Engineer', icon: Location01Icon, tone: 'start' },
  { label: 'Learn a Programming Language', icon: Tick01Icon, tone: 'complete' },
  { label: 'Operating System', icon: Tick01Icon, tone: 'complete' },
  { label: 'Terminal Knowledge', icon: Tick01Icon, tone: 'locked' },
  { label: 'Version Control Systems', icon: Tick01Icon, tone: 'locked' },
] as const;

const NOTEBOOK_ICON_CLASS_BY_TONE = {
  complete: 'text-landing-personalized-icon-complete',
  locked: 'text-landing-personalized-icon-locked',
  start: 'text-landing-personalized-icon-start',
} as const;

/**
 * A section demonstrating RMap's personalized roadmap generation capabilities
 * built exactly against Figma Node 20:588.
 */
export function PersonalizedSection() {
  return (
    <section className="bg-background relative flex flex-col items-center overflow-hidden pt-24 pb-32 lg:pt-32">
      <RainbowBar className="-top-45.25 h-86.75 opacity-20" rotate={12} />
      <MaskBackground />

      <SectionContainer className="relative z-10 flex flex-col items-center justify-center gap-16 lg:gap-32">
        {/* Top Banner Box */}
        <div className="landing-personalized-card relative flex w-full max-w-300 flex-col-reverse items-center justify-between gap-8 overflow-hidden rounded-[24px] px-6 py-8 shadow-xs sm:px-12 md:py-16 lg:flex-row lg:p-12">
          <div
            className="landing-personalized-card-inset pointer-events-none absolute inset-0 rounded-[24px]"
            aria-hidden="true"
          />

          {/* Banner Text Left */}
          <div className="relative z-10 flex w-full max-w-136 shrink-0 flex-col items-center gap-8 text-center lg:items-start lg:text-left">
            <div className="flex flex-col gap-6">
              <h2 className="text-title">Personalized Roadmaps Powered by AI</h2>
              <p className="text-subtitle">
                Share your current level and career target, then let RMap generate a personalized
                roadmap with the right topics, learning order, and milestones for your journey.
              </p>
            </div>
            <Button
              size="lg"
              className="group/btn rounded-full"
              render={<Link href={'/ai-tutor' as never} />}
            >
              Try now
              <AnimatedIconSwap icon={ArrowRight} hoverIcon={ArrowRight02FreeIcons} />
            </Button>
          </div>

          {/* Banner Graphic Right */}
          <div className="relative h-62.5 w-full max-w-109 shrink-0 md:h-80.5">
            <Image
              className="object-contain"
              fill
              src="/ai-bird-laptop.png"
              alt="AI Bird working on a laptop"
              sizes="(max-width: 768px) 100vw, 436px"
            />
          </div>
        </div>

        {/* Bottom Split Layout */}
        <div className="flex w-full flex-col-reverse items-center justify-between gap-16 lg:flex-row lg:items-center">
          {/* Notebook List (Left) */}
          <div className="relative flex w-full max-w-132 shrink-0 flex-col justify-center">
            {/* The vertical pink styling line */}
            <div
              className="landing-personalized-line pointer-events-none absolute top-0 left-14 h-[115%] w-0.5"
              aria-hidden="true"
            />

            <ul className="flex w-full flex-col">
              {NOTEBOOK_ITEMS.map((item, i) => (
                <li
                  key={i}
                  className="landing-personalized-row relative flex h-14.5 items-center transition-colors"
                >
                  {/* Icon Area placed to intersect the pink line */}
                  <div
                    className="bg-background absolute left-11.75 flex size-5 items-center justify-center rounded-full"
                    aria-hidden="true"
                  >
                    <HugeiconsIcon
                      className={`size-4 ${NOTEBOOK_ICON_CLASS_BY_TONE[item.tone]}`}
                      icon={item.icon}
                    />
                  </div>
                  {/* Text Container */}
                  <span className="text-foreground ml-24 text-lg font-medium">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Text Description */}
          <div className="flex w-full max-w-lg shrink-0 flex-col items-center gap-8 text-center lg:items-start lg:text-left">
            <div className="flex flex-col gap-6">
              <h2 className="text-title">
                Know Exactly What You
                <br className="hidden lg:block" /> Need to Learn
              </h2>
              <p className="text-subtitle">
                Stop guessing what to study next. Identify your skill gaps, follow clear learning
                priorities, and make steady progress toward your developer goals.
              </p>
            </div>
            <Button
              size="lg"
              className="group/btn rounded-full"
              render={<Link href={'/roadmaps' as never} />}
            >
              Explore now
              <AnimatedIconSwap icon={ArrowRight} hoverIcon={ArrowRight02FreeIcons} />
            </Button>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
