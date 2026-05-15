import { Mail01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { Button } from '@repo/design-system/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export function ContactSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        backgroundImage: `var(--color-bg-contact)`,
      }}
    >
      <SectionContainer className="relative flex flex-col items-center gap-8 py-20 sm:py-24 lg:py-32">
        {/* Title */}
        <h2 className="text-hero text-primary-foreground! max-w-4xl text-center sm:text-5xl! sm:leading-[1.2]! sm:tracking-[-1.2px]!">
          Need a Hand? We&apos;re Here to Help You.
        </h2>
        {/* Content Row */}
        <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:justify-center lg:gap-12">
          {/* Illustration */}
          <div className="relative aspect-435/353 w-full max-w-108.75 shrink-0">
            <Image
              className="object-contain"
              src="/contact-illustration.png"
              alt="Contact support illustration"
              fill
              sizes="(max-width: 1200px) 100vw, 435px"
            />
          </div>

          {/* Right Content */}
          <div className="flex w-full max-w-130.5 flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <p className="text-subtitle text-gray-300!">
              Whether you&apos;re stuck on a specific learning path, need help navigating your
              career roadmap, or have questions about our AI-powered features, our team is ready to
              support your growth. Reach out to us and let&apos;s master your tech journey together.
            </p>
            <div>
              <Button
                variant="outline"
                size="lg"
                className="group/btn rounded-full"
                render={<Link href="/" />}
              >
                Contact us
                <HugeiconsIcon icon={Mail01Icon} />
              </Button>
            </div>
          </div>
        </div>
      </SectionContainer>
    </section>
  );
}
