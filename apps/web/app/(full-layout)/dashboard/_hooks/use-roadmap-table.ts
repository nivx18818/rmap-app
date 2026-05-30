import { useMemo, useState } from 'react';

import type { DashboardRoadmap } from '../_types/dashboard.types';

export type StatusFilter = 'active' | 'behind' | 'completed' | 'recent';
export type TypeFilter = 'ai' | 'all' | 'template';

function filterByStatus(roadmaps: DashboardRoadmap[], filter: StatusFilter) {
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

function filterByType(roadmaps: DashboardRoadmap[], filter: TypeFilter) {
  if (filter === 'template') {
    return roadmaps.filter((roadmap) => roadmap.isTemplate);
  }

  if (filter === 'ai') {
    return roadmaps.filter((roadmap) => !roadmap.isTemplate);
  }

  return roadmaps;
}

function sortByDeadline(roadmaps: DashboardRoadmap[]) {
  return [...roadmaps].sort((a, b) => {
    // If no deadline, put it at the end
    if (!a.deadlineDate) return 1;
    if (!b.deadlineDate) return -1;
    return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
  });
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

export function useRoadmapTable(roadmaps: DashboardRoadmap[], pageSize = 10) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('recent');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRoadmaps = useMemo(() => {
    const byStatus = filterByStatus(roadmaps, statusFilter);
    const byType = filterByType(byStatus, typeFilter);

    return sortByDeadline(byType);
  }, [statusFilter, typeFilter, roadmaps]);

  const totalPages = Math.max(1, Math.ceil(filteredRoadmaps.length / pageSize));

  const pagedRoadmaps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredRoadmaps.slice(start, start + pageSize);
  }, [filteredRoadmaps, currentPage, pageSize]);

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value as StatusFilter);
    setCurrentPage(1);
  }

  function handleTypeFilterChange(value: string) {
    setTypeFilter(value as TypeFilter);
    setCurrentPage(1);
  }

  function handlePageChange(page: number) {
    setCurrentPage(Math.min(totalPages, Math.max(1, page)));
  }

  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  return {
    statusFilter,
    typeFilter,
    currentPage,
    totalPages,
    pagedRoadmaps,
    pageNumbers,
    filteredRoadmapsLength: filteredRoadmaps.length,
    handleStatusFilterChange,
    handleTypeFilterChange,
    handlePageChange,
  };
}
