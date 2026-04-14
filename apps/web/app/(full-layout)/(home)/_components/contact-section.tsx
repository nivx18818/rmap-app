import { Mail01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { Button } from '@repo/design-system/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export function ContactSection() {
  return (
    <section className="relative overflow-hidden [background-image:var(--color-bg-contact)]">
      <SectionContainer className="relative flex flex-col items-center gap-6 py-32">
        <h2 className="text-contact-title text-center">
          Need a Hand? We&apos;re Here to Help You.
        </h2>
        <div className="flex items-center gap-12">
          <div className="relative h-88.25 w-108.75 shrink-0">
            <Image
              className="object-contain"
              src="/contact-illustration.png"
              alt="Contact support illustration"
              fill
              sizes="(max-width: 1200px) 100vw, 435px"
            />
          </div>

          <div className="flex w-130.5 flex-col gap-6">
            <p className="text-subtitle text-contact-body">
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
