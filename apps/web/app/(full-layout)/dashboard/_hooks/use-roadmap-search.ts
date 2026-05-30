import { useMemo, useState } from 'react';

import type { DashboardActiveRoadmap } from '../_types/dashboard.types';
import type { RoadmapDetail } from '../../roadmaps/[id]/_types/roadmap-detail.types';

function matchesSearch(values: Array<null | string | undefined>, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return true;

  return values.filter(Boolean).some((value) => value?.toLowerCase().includes(normalizedQuery));
}

export function matchesActiveRoadmapSearch(
  roadmap: DashboardActiveRoadmap,
  query: string,
): boolean {
  return matchesSearch([roadmap.title, roadmap.goalName, roadmap.roleCategory], query);
}

export function matchesAiRoadmapSearch(roadmap: RoadmapDetail, query: string): boolean {
  return matchesSearch(
    [roadmap.title, roadmap.goalName, roadmap.description, roadmap.roleCategory],
    query,
  );
}

export function useRoadmapSearch<T>(
  roadmaps: T[],
  searchFn: (roadmap: T, query: string) => boolean,
) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoadmaps = useMemo(
    () => roadmaps.filter((roadmap) => searchFn(roadmap, searchQuery)),
    [roadmaps, searchQuery, searchFn],
  );

  return {
    searchQuery,
    setSearchQuery,
    filteredRoadmaps,
  };
}
