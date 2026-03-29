import { MapsIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { SectionContainer } from '@repo/design-system/components/ui/section-container';

export function Footer() {
  return (
    <footer
      style={{
        backgroundImage: 'var(--color-bg-footer)',
      }}
    >
      <SectionContainer className="flex items-center justify-center gap-8 p-8">
        <div className="flex items-center gap-2">
          <HugeiconsIcon className="text-primary-foreground size-8" icon={MapsIcon} />
          <span className="font-heading text-primary-foreground text-2xl font-bold tracking-[-0.5px]">
            rmap
          </span>
        </div>
        <p className="flex items-center justify-center pt-1 text-sm text-slate-400">
          Copyright © 2026 rmap studio
        </p>
      </SectionContainer>
    </footer>
  );
}
