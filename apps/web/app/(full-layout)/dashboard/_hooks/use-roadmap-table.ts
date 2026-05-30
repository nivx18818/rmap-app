import { useMemo, useState } from 'react';

import type { DashboardActiveRoadmap } from '../_types/dashboard.types';

export type FilterValue = 'active' | 'behind' | 'completed' | 'recent';

export function getFilteredRoadmaps(roadmaps: DashboardActiveRoadmap[], filter: FilterValue) {
  if (filter === 'behind') {
    return roadmaps.filter((roadmap) => roadmap.timelineWarning?.isBehind);
  }

  if (filter === 'completed') {
    return roadmaps.filter(
      (roadmap) => roadmap.nodesTotal > 0 && roadmap.nodesCompleted === roadmap.nodesTotal,
    );
  }

  return roadmaps;
}

export function buildPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (currentPage > 3) pages.push('ellipsis');

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (currentPage < totalPages - 2) pages.push('ellipsis');

  pages.push(totalPages);

  return pages;
}

export function useRoadmapTable(roadmaps: DashboardActiveRoadmap[], pageSize: number) {
  const [filter, setFilter] = useState<FilterValue>('recent');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRoadmaps = useMemo(() => getFilteredRoadmaps(roadmaps, filter), [filter, roadmaps]);

  const totalPages = Math.max(1, Math.ceil(filteredRoadmaps.length / pageSize));

  const pagedRoadmaps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredRoadmaps.slice(start, start + pageSize);
  }, [filteredRoadmaps, currentPage, pageSize]);

  function handleFilterChange(value: string) {
    setFilter(value as FilterValue);
    setCurrentPage(1);
  }

  function handlePageChange(page: number) {
    setCurrentPage(Math.min(totalPages, Math.max(1, page)));
  }

  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  return {
    filter,
    currentPage,
    totalPages,
    pagedRoadmaps,
    pageNumbers,
    filteredRoadmapsLength: filteredRoadmaps.length,
    handleFilterChange,
    handlePageChange,
  };
}
