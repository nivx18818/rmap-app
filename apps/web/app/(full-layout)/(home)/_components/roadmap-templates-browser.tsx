'use client';

import { ArrowUpRight01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import { cn } from '@repo/design-system/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import type {
  RoadmapItemData,
  RoadmapTemplate,
  RoadmapTemplateGroup,
} from '@/app/(full-layout)/(home)/_types/landing';

import { useRoadmapSearch } from '@/hooks/use-roadmap-search';

import { groupRoadmapTemplates } from '../_utils/roadmap-templates';

interface RoadmapTemplatesBrowserProps {
  loadErrorMessage?: string;
  templates?: RoadmapTemplate[];
}

const ALL_CATEGORIES = 'all';

function getGroupItemCount(groups: RoadmapTemplateGroup[]): number {
  return groups.reduce((total, group) => total + group.items.length, 0);
}

function RoadmapTemplateCard({ href = '#', label }: RoadmapItemData) {
  return (
    <Link
      className="group border-border/70 bg-background text-foreground hover:border-primary/30 hover:bg-background/90 focus-visible:ring-primary/30 flex h-11 min-w-0 items-center justify-between gap-3 rounded-md border px-3 text-sm font-medium shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-2 focus-visible:outline-hidden"
      href={href as never}
    >
      <span className="truncate">{label}</span>
      <HugeiconsIcon
        className="text-muted-foreground group-hover:text-foreground size-3.5 shrink-0 opacity-70 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
        icon={ArrowUpRight01Icon}
      />
    </Link>
  );
}

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
  const visibleTemplateCount = getGroupItemCount(filteredGroups);

  return (
    <div className="flex w-full flex-col gap-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 text-center">
        <h2 className="text-foreground text-4xl leading-tight font-semibold sm:text-5xl">
          Developer Roadmaps
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg">
          Browse the ever-growing list of up-to-date developer roadmaps grouped by category.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Link
            className="bg-foreground text-background hover:bg-foreground/90 focus-visible:ring-primary/30 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
            href="/roadmaps/generate"
          >
            Draw your own roadmap
          </Link>
          <Link
            className="bg-muted text-foreground hover:bg-muted/80 focus-visible:ring-primary/30 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-hidden"
            href="/roadmaps/generate"
          >
            Generate Roadmaps with AI
          </Link>
        </div>
      </div>

      <div className="border-border/70 bg-muted/40 grid w-full overflow-hidden rounded-lg border shadow-sm backdrop-blur-sm lg:grid-cols-[15rem_1fr]">
        <aside className="border-border/70 bg-background/60 border-b p-4 lg:border-r lg:border-b-0">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            <button
              className={cn(
                'border-border/70 text-muted-foreground hover:text-foreground shrink-0 border-b px-3 py-2 text-left text-sm font-medium transition-colors lg:w-full',
                selectedCategory === ALL_CATEGORIES && 'text-foreground font-semibold',
              )}
              type="button"
              onClick={() => setSelectedCategory(ALL_CATEGORIES)}
            >
              All Roadmaps
            </button>
            {groups.map((group) => (
              <button
                key={group.category}
                className={cn(
                  'border-border/70 text-muted-foreground hover:text-foreground shrink-0 border-b px-3 py-2 text-left text-sm font-medium transition-colors lg:w-full',
                  selectedCategory === group.category && 'text-foreground font-semibold',
                )}
                type="button"
                onClick={() => setSelectedCategory(group.category)}
              >
                {group.label}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-6 p-4 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-foreground text-sm font-semibold">
                {selectedCategory === ALL_CATEGORIES
                  ? 'All Roadmaps'
                  : groups.find((group) => group.category === selectedCategory)?.label}
              </p>
              <p className="text-muted-foreground text-xs">{visibleTemplateCount} roadmaps</p>
            </div>
            <div className="relative w-full md:max-w-xs">
              <input
                className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:ring-primary/20 h-10 w-full rounded-md border pr-3 pl-9 text-sm outline-hidden transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Search roadmaps"
                type="text"
                disabled={isSearchDisabled}
                aria-label="Search roadmaps"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <HugeiconsIcon
                className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                icon={Search01Icon}
              />
            </div>
          </div>

          {loadErrorMessage ? (
            <div className="flex flex-col items-center gap-4 px-4 text-center">
              <p className="text-muted-foreground text-sm">{loadErrorMessage}</p>
              <Button variant="outline" size="sm" type="button" onClick={() => router.refresh()}>
                Retry
              </Button>
            </div>
          ) : !hasTemplates ? (
            <p className="text-muted-foreground px-4 text-center text-sm">
              No roadmap templates are available yet.
            </p>
          ) : (
            <>
              {filteredGroups.map((group) => (
                <section key={group.category} className="flex flex-col gap-3">
                  {selectedCategory === ALL_CATEGORIES && (
                    <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      {group.label}
                    </h3>
                  )}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((item) => (
                      <RoadmapTemplateCard key={item.id ?? item.href ?? item.label} {...item} />
                    ))}
                  </div>
                </section>
              ))}

              {hasActiveSearch && !hasSearchResults && (
                <p className="text-muted-foreground px-4 text-center text-sm">
                  No roadmap titles matched &quot;{debouncedSearchTerm}&quot;. Try another keyword.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
