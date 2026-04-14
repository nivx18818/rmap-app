import { MapsIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { SectionContainer } from '@repo/design-system/components/common/section-container';

export function Footer() {
  return (
    <footer className="[background-image:var(--color-bg-footer)]">
      <SectionContainer className="flex items-center justify-center gap-8 p-8">
        <div className="flex items-center gap-2">
          <HugeiconsIcon className="text-primary-foreground size-8" icon={MapsIcon} />
          <span className="font-heading text-primary-foreground text-2xl font-bold tracking-[-0.5px]">
            RMap
          </span>
        </div>
        <p className="text-footer-copy flex items-center justify-center pt-1 text-sm">
          Copyright © 2026 RMap Team
        </p>
      </SectionContainer>
    </footer>
  );
}
