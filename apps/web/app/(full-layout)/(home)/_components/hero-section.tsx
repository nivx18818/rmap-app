'use client';

import type { Route } from 'next';

import { ArrowRight, ArrowRight02FreeIcons } from '@hugeicons/core-free-icons';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { Button } from '@repo/design-system/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

import { HeroGradient } from '@/components/shared/hero-gradient';
import { RainbowBar } from '@/components/shared/rainbow-bar';

export function HeroSection() {
  function handleScrollDown() {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  }

  return (
    <section className="relative h-screen overflow-hidden">
      <HeroGradient />
      <RainbowBar />

      {/* Hero illustration (bottom) */}
      <div className="pointer-events-none absolute bottom-0 h-2/3 w-full">
        <Image
          className="object-cover"
          src="/hero-illustration.png"
          alt="RMap platform illustration"
          fill
          priority
          sizes="100vw"
        />
      </div>

      {/* Hero content */}
      <div className="relative z-10 mx-auto flex size-full max-w-300 flex-col items-center justify-center px-8">
        {/* H1 Heading Block */}
        <h1 className="mb-6 text-center">
          <span className="text-hero block">Learn Effectively.</span>
          <span className="flex items-center justify-center gap-2.5">
            <span className="text-hero">Run any subject </span>
            <span className="relative">
              <span className="text-hero">fearlessly</span>
              {/* Wavy underline */}
              <svg
                className="absolute inset-x-0 -bottom-1 -z-10 h-3 w-full text-purple-400 sm:-bottom-0.5 lg:bottom-0"
                aria-hidden="true"
                height="12"
                preserveAspectRatio="none"
                viewBox="0 0 1213 73"
              >
                <g>
                  <path
                    fill="url(#underline-gradient)"
                    d="M1213.19 35.377c2.37-13.011-22.95-10.753-31.04-14.087C1086.89 5.705 911.742 2.887 815.218 2.809c-78.003.231-155.966-1.833-233.961.481-57.545.429-114.885 6.164-172.419 7.383-121.164 5.39-242.94 10.751-362.507 32.199-12.356 3.286-25.614 4.255-37.332 9.401-29.507 22.983 27.103 20.15 39.468 17.234 357.956-47.703 362.767-46.261 636.452-50.97 121.033-2.508 241.892 6.658 428.341 19.243 4.74.404 8.98-4.032 8-8.788a942.105 942.105 0 0154.69 6.378c9.44 1.843 18.92 3.583 28.29 5.729 4.01.839 8.02-1.718 8.95-5.712v-.01z"
                  />
                </g>
                <defs>
                  <linearGradient id="underline-gradient" x1="50%" x2="50%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#C084FC" />
                    <stop offset="95%" stopColor="#795BE9" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-subtitle mx-auto mb-8 max-w-164.75 text-center">
          <span className="font-bold">RMap</span> helps you bridge the gap between your current
          skills and career goals. Generate AI-powered, personalized learning paths and master any
          technology with confidence.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Button size="lg" className="group/btn rounded-full" onClick={handleScrollDown}>
            Explore available roadmaps
            <AnimatedIconSwap icon={ArrowRight} hoverIcon={ArrowRight02FreeIcons} />
          </Button>
          <Button variant="outline" size="lg" className="group/btn rounded-full">
            <Link href={'/ai' as Route<string>}>Create your roadmap</Link>
            <AnimatedIconSwap icon={ArrowRight} hoverIcon={ArrowRight02FreeIcons} />
          </Button>
        </div>
      </div>
    </section>
  );
}
