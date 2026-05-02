'use client';

import { Alert01Icon, Refresh01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import Link from 'next/link';

interface GenerationErrorProps {
  onRetry: () => void;
}

export function GenerationError({ onRetry }: GenerationErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-destructive/10 text-destructive mb-6 flex h-16 w-16 items-center justify-center rounded-full">
        <HugeiconsIcon className="h-8 w-8" icon={Alert01Icon} />
      </div>
      <h2 className="text-xl font-medium">Service Temporarily Unavailable</h2>
      <p className="text-muted-foreground mt-2 max-w-md">
        We&apos;re currently experiencing high demand and couldn&apos;t generate your roadmap right
        now. Please try again or check out our ready-made templates.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="gap-2" onClick={onRetry}>
          <HugeiconsIcon icon={Refresh01Icon} />
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline" size="lg">
            View Templates
          </Button>
        </Link>
      </div>
    </div>
  );
}
