'use client';

import { Alert02Icon, Refresh01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { toast } from '@repo/design-system/lib/toast';
import { isAxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';

import { HeroGradient } from '@/components/shared/hero-gradient';
import { MaskBackground } from '@/components/shared/mask-background';
import { roadmapService } from '@/services/roadmap.service';

import type { DashboardRoadmap } from '../_types/dashboard.types';

import { useDashboard } from '../_hooks/use-dashboard';
import { DashboardEmptyState } from './dashboard-empty-state';
import { DashboardMain } from './dashboard-main';
import { DashboardSectionContainer } from './dashboard-section-container';
import { DashboardSidebar } from './dashboard-sidebar';

const EMPTY_ACTIVE_ROADMAPS: DashboardRoadmap[] = [];

function getDefaultFocusRoadmap(roadmaps: DashboardRoadmap[]): DashboardRoadmap | null {
  if (roadmaps.length === 0) return null;

  return (
    roadmaps.find((roadmap) => roadmap.timelineWarning?.isBehind) ??
    [...roadmaps].sort((first, second) => second.streakDays - first.streakDays)[0] ??
    null
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-38 rounded-lg" />
        <Skeleton className="h-52 rounded-lg" />
        <Skeleton className="h-44 rounded-lg" />
        <Skeleton className="h-44 rounded-lg" />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-80 max-w-full" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>
        <div className="grid gap-4 2xl:grid-cols-2">
          <Skeleton className="h-78 rounded-lg" />
          <Skeleton className="h-78 rounded-lg" />
        </div>
        <Skeleton className="h-56 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

export function DashboardContent() {
  const { dashboard, errorMessage, isLoading, refreshDashboard } = useDashboard();
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<null | string>(null);
  const roadmaps = dashboard?.roadmaps ?? EMPTY_ACTIVE_ROADMAPS;
  const defaultFocusRoadmap = useMemo(() => getDefaultFocusRoadmap(roadmaps), [roadmaps]);
  const selectedRoadmap =
    roadmaps.find((roadmap) => roadmap.roadmapId === selectedRoadmapId) ?? defaultFocusRoadmap;
  const hasAnyRoadmap = dashboard ? dashboard.roadmaps.length > 0 : false;

  const handleRemoveRoadmap = async (roadmap: DashboardRoadmap): Promise<boolean> => {
    try {
      if (roadmap.isTemplate) {
        await roadmapService.deleteTemplateProgress(roadmap.roadmapId);
        toast.success('Learning progress deleted successfully');
      } else {
        await roadmapService.deleteRoadmap(roadmap.roadmapId);
        toast.success('Roadmap deleted successfully');
      }

      if (selectedRoadmapId === roadmap.roadmapId) {
        setSelectedRoadmapId(null);
      }

      await refreshDashboard();
      return true;
    } catch (error) {
      if (roadmap.isTemplate && isAxiosError(error) && error.response?.status === 409) {
        toast.error('Learning progress cannot be deleted while a milestone submission is running.');
      } else {
        toast.error(
          roadmap.isTemplate ? 'Failed to delete learning progress' : 'Failed to delete roadmap',
        );
      }

      return false;
    }
  };

  useEffect(() => {
    if (selectedRoadmapId && roadmaps.length > 0) {
      const stillExists = roadmaps.some((roadmap) => roadmap.roadmapId === selectedRoadmapId);

      if (!stillExists && defaultFocusRoadmap) {
        setSelectedRoadmapId(defaultFocusRoadmap.roadmapId);
      }
    }
  }, [roadmaps, defaultFocusRoadmap, selectedRoadmapId]);

  return (
    <main className="flex flex-1 flex-col pt-28 pb-8 sm:pt-32">
      <HeroGradient />
      <div
        className="absolute -top-16 left-0 flex h-20 w-full items-center justify-center"
        aria-hidden="true"
      >
        <div className="h-full w-full rotate-0">
          <div className="h-full w-full bg-linear-to-r from-[#7dd3fc] via-[#a5b4fc] to-[#f9a8d4] blur-[32px]" />
        </div>
      </div>
      <MaskBackground />

      <DashboardSectionContainer
        className={
          !isLoading && !errorMessage && !hasAnyRoadmap
            ? 'flex flex-1 items-center justify-center'
            : undefined
        }
      >
        {isLoading ? (
          <DashboardSkeleton />
        ) : errorMessage ? (
          <Card className="mx-auto mt-20 max-w-lg rounded-lg">
            <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
              <div className="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-full">
                <HugeiconsIcon className="size-6" icon={Alert02Icon} />
              </div>
              <div className="flex max-w-md flex-col gap-2">
                <h1 className="text-heading text-2xl">Dashboard failed to load</h1>
                <p className="text-muted-foreground text-sm">{errorMessage}</p>
              </div>
              <Button type="button" onClick={refreshDashboard}>
                <HugeiconsIcon data-icon="inline-start" icon={Refresh01Icon} />
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : dashboard && hasAnyRoadmap ? (
          <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <DashboardSidebar
              userProfile={dashboard.userProfile}
              roadmapStatus={dashboard.roadmapStatus}
              skillCategories={dashboard.skillCategories}
              summary={dashboard.summary}
              activityRecent={dashboard.activityRecent}
            />
            <DashboardMain
              dashboard={dashboard}
              selectedRoadmap={selectedRoadmap}
              onRemoveRoadmap={handleRemoveRoadmap}
              onSelectRoadmap={setSelectedRoadmapId}
            />
          </div>
        ) : (
          <DashboardEmptyState />
        )}
      </DashboardSectionContainer>
    </main>
  );
}
