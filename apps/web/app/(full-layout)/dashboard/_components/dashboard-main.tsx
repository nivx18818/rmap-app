import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@repo/design-system/components/ui/badge';

import type { Dashboard, DashboardRoadmap } from '../_types/dashboard.types';

import { getDashboardGreetingMeta } from '../_utils/dashboard-greeting';
import { DashboardActiveRoadmapsTable } from './dashboard-active-roadmaps-table';
import { DashboardCurrentRoadmap } from './dashboard-current-roadmap';
import { DashboardOverallProgress } from './dashboard-overall-progress';

interface DashboardMainProps {
  dashboard: Dashboard;
  onSelectRoadmap: (roadmapId: string) => void;
  onDeleteRoadmap: (roadmapId: string) => void;
  selectedRoadmap: DashboardRoadmap | null;
}

export function DashboardMain({
  dashboard,
  onSelectRoadmap,
  onDeleteRoadmap,
  selectedRoadmap,
}: DashboardMainProps) {
  const firstName = dashboard.userProfile.fullName.split(' ')[0] || 'there';
  const greeting = getDashboardGreetingMeta(firstName);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-heading flex min-w-0 items-center gap-3 text-2xl sm:text-3xl">
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-lg sm:size-8 ${greeting.iconClassName}`}
            >
              <HugeiconsIcon className="size-full" icon={greeting.icon} />
            </span>
            <span className="min-w-0 truncate">{greeting.text}</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            A focused overview of your learning journey with RMap.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Dashboard</Badge>
          <Badge variant="outline">{dashboard.summary.activeRoadmaps} active roadmaps</Badge>
        </div>
      </div>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,0.85fr)_minmax(520px,1.15fr)]">
        <DashboardOverallProgress summary={dashboard.summary} />
        <DashboardCurrentRoadmap roadmap={selectedRoadmap} />
      </div>

      <DashboardActiveRoadmapsTable
        roadmaps={dashboard.roadmaps}
        selectedRoadmapId={selectedRoadmap?.roadmapId ?? null}
        onDeleteRoadmap={onDeleteRoadmap}
        onSelectRoadmap={onSelectRoadmap}
      />
    </div>
  );
}
