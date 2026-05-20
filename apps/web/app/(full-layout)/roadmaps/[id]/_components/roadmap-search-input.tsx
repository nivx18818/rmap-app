'use client';

import { Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Input } from '@repo/design-system/components/ui/input';

interface RoadmapSearchInputProps {
  isMatchingLoading: boolean;
  isSearchActive: boolean;
  matchedCount: number;
  onQueryChange: (query: string) => void;
  query: string;
}

export function RoadmapSearchInput({
  isMatchingLoading,
  isSearchActive,
  matchedCount,
  onQueryChange,
  query,
}: RoadmapSearchInputProps) {
  return (
    <div className="relative min-w-0 flex-1 lg:w-90 lg:flex-none">
      <HugeiconsIcon
        size={22}
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        icon={Search01Icon}
      />
      <Input
        className={isSearchActive ? 'pr-28 pl-10 sm:pr-32' : 'pl-10'}
        placeholder="Search skills"
        aria-label="Search roadmap nodes"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      {isSearchActive ? (
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center text-xs font-medium">
          {isMatchingLoading ? (
            <span
              className="border-muted-foreground/30 border-t-muted-foreground inline-flex size-4 animate-spin rounded-full border-2"
              aria-hidden="true"
            />
          ) : (
            <>
              {matchedCount} {matchedCount === 1 ? 'node' : 'nodes'} found
            </>
          )}
        </span>
      ) : null}
    </div>
  );
}
