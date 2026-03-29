import { Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { SectionContainer } from '@repo/design-system/components/ui/section-container';
import Image from 'next/image';

import { ROLE_BASED_ROADMAPS, SKILL_BASED_ROADMAPS } from '@/lib/data/landing';

import { CategoryLabel } from './ui/category-label';
import MaskBackground from './ui/mask-background';
import { RainbowBar } from './ui/rainbow-bar';
import { RoadmapGrid } from './ui/roadmap-grid';

export function RoadmapSection() {
  return (
    <section className="bg-background relative flex flex-col items-center overflow-hidden pt-24 pb-32 lg:pt-32">
      <RainbowBar />

      <MaskBackground />

      <SectionContainer className="relative z-10 flex flex-col items-center justify-center gap-16">
        {/* Intro Layout: Text + Globe */}
        <div className="flex w-full flex-col-reverse items-center justify-between gap-12 lg:flex-row lg:items-end lg:gap-8">
          {/* Left Text */}
          <div className="flex w-full max-w-134 flex-col gap-6">
            <h2 className="text-title">
              Discover Learning Roadmaps,
              <br /> Master Any Technology.
            </h2>
            <p className="text-subtitle">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
              has been the industry&apos;s standard dummy text ever since the 1500s, when an unknown
              printer took a galley of type and scrambled it to make a type specimen book.
            </p>

            {/* Slash line (Decoration) */}
            <div className="flex h-1 w-full flex-col justify-end pt-4">
              <div className="block h-1 w-full bg-linear-to-r from-[#a39ac1] via-[#a39ac1]/35 via-10% to-transparent">
                <svg className="-mt-px fill-[#a39ac1]" width="6" height="3" viewBox="0 0 6 3">
                  <path d="M2.594 2.525A1.501 1.501 0 112.635.519c.274.295.665.479 1.098.479H6v1.004H3.733a1.5 1.5 0 00-1.108.489l-.017.02-.013.015-.001-.001z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Right Image (Globe) */}
          <div className="relative h-62.5 w-62.5 shrink-0 sm:h-87.75 sm:w-[384px]">
            <Image
              className="object-contain"
              src="/roadmap-globe.png"
              alt="Globe with hot air balloons"
              fill
              priority
            />
          </div>
        </div>

        {/* Roadmap List & Search Bar layout */}
        <div className="flex w-full flex-col items-center gap-12">
          {/* Search Bar Container */}
          <div className="flex w-full items-center justify-center px-4 sm:px-25 md:px-50 lg:px-72">
            <div
              className="group/search border-border relative h-12 w-full max-w-140 shrink-0 rounded-full border p-px shadow-sm transition-all duration-300 focus-within:border-violet-500/50 focus-within:ring-4 focus-within:ring-violet-500/10 hover:border-violet-500/30"
              style={{
                backgroundImage: `var(--color-gradient-search-bar)`,
              }}
            >
              <div className="bg-background/50 flex size-full items-center overflow-hidden rounded-full pr-5 pl-11.5 backdrop-blur-sm">
                <input
                  className="peer text-muted-foreground placeholder:text-muted-foreground focus:text-foreground size-full bg-transparent text-base font-light outline-hidden"
                  placeholder="Search roadmaps..."
                  type="text"
                  aria-label="Search roadmaps"
                />
              </div>
              <HugeiconsIcon
                className="text-muted-foreground group-hover/search:text-foreground peer-focus:text-primary absolute top-1/2 left-4.5 size-4.5 -translate-y-1/2 transition-colors duration-300"
                icon={Search01Icon}
              />
            </div>
          </div>

          {/* Lists Container */}
          <div className="flex w-full flex-col gap-12">
            {/* Role-based Roadmaps */}
            <div className="flex flex-col items-center gap-6">
              <CategoryLabel label="Role-based Roadmaps" />
              <div className="w-full">
                <RoadmapGrid items={ROLE_BASED_ROADMAPS} />
              </div>
            </div>

            {/* Skill-based Roadmaps */}
            <div className="flex flex-col items-center gap-6">
              <CategoryLabel label="Skill-based Roadmaps" />
              <div className="w-full">
                <RoadmapGrid items={SKILL_BASED_ROADMAPS} />
              </div>
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
