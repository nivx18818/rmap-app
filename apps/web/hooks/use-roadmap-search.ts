import * as React from 'react';

import type {
  RoadmapItemData,
  RoadmapTemplateGroup,
} from '@/app/(full-layout)/(home)/_types/landing';

import { useDebounce } from '@/hooks/use-debounce';

const DEFAULT_SEARCH_DEBOUNCE_MS = 250;

interface UseRoadmapSearchOptions {
  debounceMs?: number;
  groups: RoadmapTemplateGroup[];
}

function filterRoadmapsByTitle(roadmaps: RoadmapItemData[], normalizedSearchTerm: string) {
  if (!normalizedSearchTerm) {
    return roadmaps;
  }

  return roadmaps.filter((roadmap) => roadmap.label.toLowerCase().includes(normalizedSearchTerm));
}

export function useRoadmapSearch({
  debounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
  groups,
}: UseRoadmapSearchOptions) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  const normalizedSearchTerm = React.useMemo(
    () => debouncedSearchTerm.trim().toLowerCase(),
    [debouncedSearchTerm],
  );

  const filteredGroups = React.useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: filterRoadmapsByTitle(group.items, normalizedSearchTerm),
        }))
        .filter((group) => group.items.length > 0),
    [groups, normalizedSearchTerm],
  );

  const hasActiveSearch = normalizedSearchTerm.length > 0;
  const hasSearchResults = filteredGroups.length > 0;

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    filteredGroups,
    hasActiveSearch,
    hasSearchResults,
  };
}
