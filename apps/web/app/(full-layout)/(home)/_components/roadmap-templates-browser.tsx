'use client';

import { Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import { cn } from '@repo/design-system/lib/utils';
import { useRouter } from 'next/navigation';
import { type ReactNode, useMemo, useState } from 'react';

import type { RoadmapTemplate } from '@/app/(full-layout)/(home)/_types/landing';

import { useRoadmapSearch } from '@/hooks/use-roadmap-search';

import { groupRoadmapTemplates } from '../_utils/roadmap-templates';
import { RoadmapGrid } from './ui/roadmap-grid';

interface RoadmapTemplatesBrowserProps {
  loadErrorMessage?: string;
  templates?: RoadmapTemplate[];
}

const ALL_CATEGORIES = 'all';

export function RoadmapTemplatesBrowser({
  loadErrorMessage,
  templates = [],
}: RoadmapTemplatesBrowserProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const groups = useMemo(() => groupRoadmapTemplates(templates), [templates]);
  const selectedGroups = useMemo(
    () =>
      selectedCategory === ALL_CATEGORIES
        ? groups
        : groups.filter((group) => group.category === selectedCategory),
    [groups, selectedCategory],
  );
  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    filteredGroups,
    hasActiveSearch,
    hasSearchResults,
  } = useRoadmapSearch({ groups: selectedGroups });

  const hasTemplates = templates.length > 0;
  const isSearchDisabled = Boolean(loadErrorMessage) || !hasTemplates;

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex w-full items-center justify-center px-4 md:px-12 lg:px-32 xl:px-72">
        <div
          className="group/search border-border relative h-12 w-full max-w-140 shrink-0 rounded-full border p-px shadow-sm transition-all duration-300 focus-within:border-violet-500/50 focus-within:ring-4 focus-within:ring-violet-500/10 hover:border-violet-500/30"
          style={{
            backgroundImage: 'var(--color-gradient-search-bar)',
          }}
        >
          <div className="bg-background/70 flex size-full items-center overflow-hidden rounded-full pr-5 pl-11.5 backdrop-blur-sm">
            <input
              className="peer text-muted-foreground placeholder:text-muted-foreground focus:text-foreground size-full bg-transparent text-base font-light outline-hidden disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Search roadmap titles..."
              type="search"
              disabled={isSearchDisabled}
              aria-label="Search roadmaps"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <HugeiconsIcon
            className="text-muted-foreground group-hover/search:text-foreground peer-focus:text-primary absolute top-1/2 left-4.5 size-4.5 -translate-y-1/2 transition-colors duration-300"
            icon={Search01Icon}
          />
        </div>
      </div>

      <div className="border-border/70 bg-background/65 flex w-full flex-col overflow-hidden rounded-2xl border shadow-sm backdrop-blur-md md:grid md:grid-cols-[15rem_1fr]">
        <aside className="border-border/70 bg-background/75 border-b md:border-r md:border-b-0">
          <div className="flex flex-row gap-2 overflow-x-auto p-4 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-col [&::-webkit-scrollbar]:hidden">
            <CategoryButton
              label="All Roadmaps"
              count={templates.length}
              isActive={selectedCategory === ALL_CATEGORIES}
              onClick={() => setSelectedCategory(ALL_CATEGORIES)}
            />
            {groups.map((group) => (
              <CategoryButton
                key={group.category}
                label={group.label}
                count={group.items.length}
                isActive={selectedCategory === group.category}
                onClick={() => setSelectedCategory(group.category)}
              />
            ))}
          </div>
        </aside>

        <div className="min-w-0 p-4 md:p-8">
          {loadErrorMessage ? (
            <RoadmapStatusMessage message={loadErrorMessage}>
              <Button variant="outline" size="sm" type="button" onClick={() => router.refresh()}>
                Retry
              </Button>
            </RoadmapStatusMessage>
          ) : !hasTemplates ? (
            <RoadmapStatusMessage message="No roadmap templates are available yet." />
          ) : (
            <div className="flex flex-col gap-8">
              {filteredGroups.map((group) => (
                <section key={group.category} className="flex flex-col gap-3">
                  {(selectedCategory === ALL_CATEGORIES || filteredGroups.length === 1) && (
                    <div className="flex items-center justify-between gap-3 px-0.5">
                      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                        {group.label}
                      </h3>
                      <span className="text-muted-foreground text-xs">
                        {group.items.length} roadmap{group.items.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  )}
                  <RoadmapGrid items={group.items} />
                </section>
              ))}

              {hasActiveSearch && !hasSearchResults && (
                <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                  No roadmap titles matched &quot;{debouncedSearchTerm}&quot;. Try another keyword.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryButton({
  count,
  isActive,
  label,
  onClick,
}: {
  count: number;
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        'border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50 flex shrink-0 items-center justify-between gap-4 rounded-lg px-3 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors md:w-full md:rounded-none md:border-b md:py-2.5 md:whitespace-normal',
        isActive && 'text-foreground bg-muted/50 font-semibold md:bg-transparent',
      )}
      type="button"
      onClick={onClick}
    >
      <span className="truncate">{label}</span>
      <span className="text-muted-foreground/70 text-xs">{count}</span>
    </button>
  );
}

function RoadmapStatusMessage({ children, message }: { children?: ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
      {children}
    </div>
  );
}
