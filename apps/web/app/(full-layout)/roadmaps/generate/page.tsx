import { SectionContainer } from '@repo/design-system/components/common/section-container';
import Image from 'next/image';

import { HeroGradient } from '@/components/shared/hero-gradient';
import { MaskBackground } from '@/components/shared/mask-background';
import { RainbowBar } from '@/components/shared/rainbow-bar';

import { OnboardingWizard } from './_components/onboarding-wizard';

export default function AiRoadmapPage() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden py-32">
      <Image
        className="pointer-events-none absolute top-0 left-0 h-auto w-full object-cover opacity-70 sm:opacity-100"
        src="/ai-image.png"
        alt="AI roadmap illustration"
        width={1304}
        height={809}
      />
      <MaskBackground />
      <HeroGradient />
      <RainbowBar />

      <SectionContainer className="relative z-10 flex h-full w-full flex-col items-center justify-center">
        <div className="md:border-background/30 md:bg-background/60 flex w-full max-w-4xl flex-col gap-6 md:rounded-3xl md:border md:px-6 md:py-8 md:shadow-sm md:backdrop-blur-sm lg:px-10 lg:py-10">
          <OnboardingWizard />
        </div>
      </SectionContainer>
    </section>
  );
}
