'use client';

import { useMemo } from 'react';

import type { DashboardActiveRoadmap } from '../_types/dashboard.types';
import type { RoadmapDetail } from '../../../(full-layout)/roadmaps/[id]/_types/roadmap-detail.types';

import { ActiveRoadmapsDrawer } from './drawers/active-roadmaps-drawer';
import { AiRoadmapsDrawer } from './drawers/ai-roadmaps-drawer';

interface DashboardRoadmapActionsProps {
  activeRoadmaps: DashboardActiveRoadmap[];
  onSelectRoadmap: (roadmapId: string) => void;
  selectedRoadmapId: null | string;
  userRoadmaps: RoadmapDetail[];
}

export function DashboardRoadmapActions({
  activeRoadmaps,
  onSelectRoadmap,
  selectedRoadmapId,
  userRoadmaps,
}: DashboardRoadmapActionsProps) {
  const aiRoadmaps = useMemo(
    () => userRoadmaps.filter((roadmap) => !roadmap.isTemplate),
    [userRoadmaps],
  );

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
      <ActiveRoadmapsDrawer
        roadmaps={activeRoadmaps}
        selectedRoadmapId={selectedRoadmapId}
        onSelectRoadmap={onSelectRoadmap}
      />
      <AiRoadmapsDrawer roadmaps={aiRoadmaps} />
    </div>
  );
}
