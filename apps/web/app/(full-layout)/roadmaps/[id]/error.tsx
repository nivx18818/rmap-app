'use client';

import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { Button } from '@repo/design-system/components/ui/button';

export default function RoadmapDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="bg-background min-h-screen">
      <SectionContainer className="flex min-h-screen flex-col items-center justify-center gap-5 text-center">
        <div className="flex max-w-md flex-col gap-2">
          <h1 className="text-foreground text-2xl font-semibold">Roadmap failed to load</h1>
          <p className="text-muted-foreground text-sm">
            {error.message || 'Refresh the roadmap detail page and try again.'}
          </p>
        </div>
        <Button type="button" onClick={reset}>
          Try again
        </Button>
      </SectionContainer>
    </main>
  );
}
