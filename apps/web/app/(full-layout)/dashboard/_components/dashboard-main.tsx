import { Badge } from '@repo/design-system/components/ui/badge';

import type { Dashboard, DashboardActiveRoadmap } from '../_types/dashboard.types';

import { DashboardActiveRoadmapsTable } from './dashboard-active-roadmaps-table';
import { DashboardCurrentRoadmap } from './dashboard-current-roadmap';
import { DashboardOverallProgress } from './dashboard-overall-progress';

interface DashboardMainProps {
  dashboard: Dashboard;
  onSelectRoadmap: (roadmapId: string) => void;
  selectedRoadmap: DashboardActiveRoadmap | null;
}

export function DashboardMain({ dashboard, onSelectRoadmap, selectedRoadmap }: DashboardMainProps) {
  const firstName = dashboard.userProfile.fullName.split(' ')[0] || 'there';

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-heading text-2xl sm:text-3xl">
            {firstName}&apos;s learning dashboard
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
        <DashboardOverallProgress
          summary={dashboard.summary}
          activeRoadmaps={dashboard.activeRoadmaps}
          selectedRoadmapId={selectedRoadmap?.roadmapId ?? null}
          userRoadmaps={dashboard.userRoadmaps}
          onSelectRoadmap={onSelectRoadmap}
        />
        <DashboardCurrentRoadmap roadmap={selectedRoadmap} />
      </div>

      <DashboardActiveRoadmapsTable
        roadmaps={dashboard.activeRoadmaps}
        selectedRoadmapId={selectedRoadmap?.roadmapId ?? null}
        onSelectRoadmap={onSelectRoadmap}
      />
    </div>
  );
}
