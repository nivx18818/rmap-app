import { Mail01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import { SectionContainer } from '@repo/design-system/components/ui/section-container';
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
      <SectionContainer className="relative flex flex-col items-center gap-6 py-32">
        {/* Title */}
        <h2 className="text-hero text-primary-foreground! text-center text-5xl! leading-[1.2]! tracking-[-1.2px]!">
          Need a Hand? We&apos;re Here to Help You.
        </h2>
        {/* Content Row */}
        <div className="flex items-center gap-12">
          {/* Illustration */}
          <div className="relative h-88.25 w-108.75 shrink-0">
            <Image
              className="object-contain"
              src="/contact-illustration.png"
              alt="Contact support illustration"
              fill
            />
          </div>

          {/* Right Content */}
          <div className="flex w-130.5 flex-col gap-6">
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
