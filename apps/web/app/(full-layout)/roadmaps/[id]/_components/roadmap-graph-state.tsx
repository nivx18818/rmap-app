'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { cn } from '@repo/design-system/lib/utils';

export const ROADMAP_STATE_CONTAINER_CLASS =
  'border-border bg-background/80 overflow-hidden rounded-lg border shadow-sm backdrop-blur-sm min-h-[20rem] sm:min-h-[28rem] lg:min-h-[37.5rem]';

type RoadmapGraphStateKind = 'empty' | 'error' | 'loading' | 'no-matches';

interface RoadmapGraphStateProps {
  errorMessage?: string | null;
  kind: RoadmapGraphStateKind;
  onRetry?: () => void;
}

export function RoadmapGraphState({ errorMessage, kind, onRetry }: RoadmapGraphStateProps) {
  if (kind === 'loading') {
    return (
      <div className={ROADMAP_STATE_CONTAINER_CLASS}>
        <div className="flex h-full flex-col gap-4 p-4 sm:p-5">
          <Skeleton className="h-10 w-40 sm:w-64" />
          <Skeleton className="min-h-56 w-full sm:min-h-88 lg:min-h-120" />
        </div>
      </div>
    );
  }

  if (kind === 'error') {
    return (
      <div
        className={cn(
          ROADMAP_STATE_CONTAINER_CLASS,
          'flex h-full flex-col items-center justify-center gap-3 px-4 py-10 text-center sm:px-6',
        )}
      >
        <div className="flex max-w-md flex-col gap-2">
          <h2 className="text-foreground text-lg font-semibold sm:text-xl">
            The roadmap is unavailable now
          </h2>
          <p className="text-muted-foreground text-sm">{errorMessage}</p>
        </div>
        <Button type="button" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (kind === 'no-matches') {
    return (
      <div className="border-border bg-background/80 flex flex-col items-center justify-center gap-2 rounded-lg border px-4 py-10 text-center shadow-sm backdrop-blur-sm sm:px-6">
        <h2 className="text-foreground text-lg font-semibold sm:text-xl">
          No matching nodes found
        </h2>
        <p className="text-muted-foreground max-w-md text-sm">
          Clear search, adjust filters, or try another keyword.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        ROADMAP_STATE_CONTAINER_CLASS,
        'flex h-full flex-col items-center justify-center gap-3 px-4 py-10 text-center sm:px-6',
      )}
    >
      <h2 className="text-foreground text-lg font-semibold sm:text-xl">No visible nodes</h2>
      <p className="text-muted-foreground max-w-md text-sm">
        Adjust the filters or search query to show roadmap nodes.
      </p>
    </div>
  );
}
