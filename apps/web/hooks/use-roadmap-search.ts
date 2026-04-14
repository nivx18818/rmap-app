import * as React from 'react';

import type { RoadmapItemData } from '@/app/(full-layout)/(home)/_types/landing';

import { useDebounce } from '@/hooks/use-debounce';

const DEFAULT_SEARCH_DEBOUNCE_MS = 250;

interface UseRoadmapSearchOptions {
  roleBasedRoadmaps: RoadmapItemData[];
  skillBasedRoadmaps: RoadmapItemData[];
  debounceMs?: number;
}

function filterRoadmapsByTitle(roadmaps: RoadmapItemData[], normalizedSearchTerm: string) {
  if (!normalizedSearchTerm) {
    return roadmaps;
  }

  return roadmaps.filter((roadmap) => roadmap.label.toLowerCase().includes(normalizedSearchTerm));
}

export function useRoadmapSearch({
  roleBasedRoadmaps,
  skillBasedRoadmaps,
  debounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
}: UseRoadmapSearchOptions) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  const normalizedSearchTerm = React.useMemo(
    () => debouncedSearchTerm.trim().toLowerCase(),
    [debouncedSearchTerm],
  );

  const filteredRoleBasedRoadmaps = React.useMemo(
    () => filterRoadmapsByTitle(roleBasedRoadmaps, normalizedSearchTerm),
    [normalizedSearchTerm, roleBasedRoadmaps],
  );

  const filteredSkillBasedRoadmaps = React.useMemo(
    () => filterRoadmapsByTitle(skillBasedRoadmaps, normalizedSearchTerm),
    [normalizedSearchTerm, skillBasedRoadmaps],
  );

  const hasActiveSearch = normalizedSearchTerm.length > 0;
  const hasSearchResults =
    filteredRoleBasedRoadmaps.length > 0 || filteredSkillBasedRoadmaps.length > 0;

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    filteredRoleBasedRoadmaps,
    filteredSkillBasedRoadmaps,
    hasActiveSearch,
    hasSearchResults,
  };
}
