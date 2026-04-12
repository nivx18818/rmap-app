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
import { cn } from '@repo/design-system/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

import { MaskBackground } from '../../../../components/shared/mask-background';
import { RainbowBar } from '../../../../components/shared/rainbow-bar';

const NOTEBOOK_ITEMS = [
  { label: 'Road to DevOps Engineer', icon: Location01Icon, iconClass: 'text-indigo-500' },
  { label: 'Learn a Programming Language', icon: Tick01Icon, iconClass: 'text-emerald-500' },
  { label: 'Operating System', icon: Tick01Icon, iconClass: 'text-emerald-500' },
  { label: 'Terminal Knowledge', icon: Tick01Icon, iconClass: 'text-rose-500' },
  { label: 'Version Control Systems', icon: Tick01Icon, iconClass: 'text-rose-500' },
];

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
        <div
          className="relative flex w-full max-w-300 flex-col-reverse items-center justify-between gap-8 overflow-hidden rounded-[24px] px-6 py-8 shadow-xs sm:px-12 md:py-16 lg:flex-row lg:p-12"
          style={{
            backgroundImage:
              'linear-gradient(161.932deg, rgb(255, 251, 235) 0%, rgb(255, 247, 237) 50%, rgb(251, 207, 232) 100%), linear-gradient(90deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.75) 100%)',
          }}
        >
          {/* Inner borders via inset shadow */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[24px] shadow-[inset_0px_0px_0px_1px_rgba(76,29,149,0.1),inset_0px_0px_0px_0px_white]"
            aria-hidden="true"
          />

          {/* Banner Text Left */}
          <div className="relative z-10 flex w-full max-w-136 shrink-0 flex-col items-center gap-8 text-center lg:items-start lg:text-left">
            <div className="flex flex-col gap-6">
              <h2 className="text-title text-3xl!">Personalized Roadmaps Powered by AI</h2>
              <p className="text-subtitle">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem
                Ipsum has been the industry&apos;s standard dummy text ever since the 1500s, when an
                unknown printer took a galley of type and scrambled it to make a type specimen book.
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
              className="pointer-events-none absolute top-0 left-14 h-[115%] w-0.5 bg-pink-300/20"
              aria-hidden="true"
            />

            <ul className="flex w-full flex-col">
              {NOTEBOOK_ITEMS.map((item, i) => (
                <li
                  key={i}
                  className="relative flex h-14.5 items-center border-b border-indigo-200/60 transition-colors hover:bg-slate-50/50"
                >
                  {/* Icon Area placed to intersect the pink line */}
                  <div
                    className="bg-background absolute left-11.75 flex size-5 items-center justify-center rounded-full"
                    aria-hidden="true"
                  >
                    <HugeiconsIcon className={cn('size-4', item.iconClass)} icon={item.icon} />
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
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem
                Ipsum has been the industry&apos;s standard dummy text ever since the 1500s, when an
                unknown printer took a galley of type and scrambled it to make a type specimen book.
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
