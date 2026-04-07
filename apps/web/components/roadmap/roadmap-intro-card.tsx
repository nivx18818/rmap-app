import { ArrowRight, ArrowRight02FreeIcons } from '@hugeicons/core-free-icons';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { Button } from '@repo/design-system/components/ui/button';
import { cn } from '@repo/design-system/lib/utils';
import Link from 'next/link';

import { IntroCheckIcon, IntroMapIcon } from './roadmap-icons';

const INTRO_CARD_ITEMS = [
  { label: 'Road to DevOps Engineer', tone: 'neutral' as const, variant: 'map' as const },
  { label: 'Learn a Programming Language', tone: 'green' as const, variant: 'check' as const },
  { label: 'Operating System', tone: 'green' as const, variant: 'check' as const },
  { label: 'Terminal Knowledge', tone: 'pink' as const, variant: 'check' as const },
  { label: 'Version Control Systems', tone: 'pink' as const, variant: 'check' as const },
];

export function RoadmapIntroCard() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-8 py-16">
      <div className="relative overflow-hidden rounded-[24px] [background-image:linear-gradient(160.31deg,_rgb(255,251,235)_0%,_rgb(255,247,237)_50%,_rgb(251,207,232)_100%),linear-gradient(90deg,_rgba(255,255,255,0.75)_0%,_rgba(255,255,255,0.75)_100%)] p-8 shadow-[inset_0_0_0_1px_rgba(76,29,149,0.1)]">
        <div className="grid items-center gap-6 lg:grid-cols-[528px_512px] lg:justify-between">
          <div className="relative h-[342.5px]">
            <div className="absolute top-0 left-[56px] h-[342.5px] w-px bg-[linear-gradient(180deg,rgba(251,113,133,0.12),rgba(251,113,133,0.48),rgba(251,113,133,0.08))]" />
            {INTRO_CARD_ITEMS.map((item, index) => (
              <div
                key={item.label}
                className="absolute left-0 h-[52.5px] w-full"
                style={{ top: `${40 + index * 52.5}px` }}
              >
                <div className="absolute top-0 left-0 h-px w-full bg-[#bae6fd]" />
                <div className="absolute top-1/2 left-[56px] h-px w-[24px] -translate-y-1/2 bg-[#f9a8d4]" />
                <div className="absolute top-[17px] left-[80px] text-black">
                  {item.variant === 'map' ? (
                    <IntroMapIcon />
                  ) : (
                    <IntroCheckIcon tone={item.tone === 'green' ? 'green' : 'pink'} />
                  )}
                </div>
                <div
                  className={cn(
                    'absolute top-1/2 left-[106px] -translate-y-1/2 text-[18px] leading-[28.5px] text-black',
                    item.variant === 'map' ? 'font-semibold' : 'font-medium',
                  )}
                >
                  {item.label}
                </div>
              </div>
            ))}
            <div className="absolute bottom-[40px] left-0 h-px w-full bg-[#bae6fd]" />
          </div>

          <div className="flex flex-col justify-center gap-6">
            <h2 className="font-heading text-[34.7px] leading-[47.7px] font-medium tracking-[-0.9px] text-[#281950]">
              Know Exactly What You
              <br />
              Need to Learn
            </h2>

            <p className="text-[18.3px] leading-[28.5px] text-[rgba(40,25,80,0.75)]">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
              has been the industry&apos;s standard dummy text ever since the 1500s, when an unknown
              printer took a galley of type and scrambled it to make a type specimen book.
            </p>

            <div>
              <Button
                size="lg"
                className="group/btn rounded-full px-5"
                render={<Link href="/roadmaps/frontend" />}
              >
                Explore now
                <AnimatedIconSwap icon={ArrowRight} hoverIcon={ArrowRight02FreeIcons} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
