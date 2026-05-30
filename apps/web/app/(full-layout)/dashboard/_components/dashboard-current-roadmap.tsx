'use client';

import type { Route } from 'next';
import type { ComponentProps } from 'react';

import {
  Alert02Icon,
  ArrowRight02FreeIcons,
  Calendar03Icon,
  Clock01Icon,
  FireIcon,
  Route01Icon,
  Target02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import Link from 'next/link';

import type { DashboardRoadmap } from '../_types/dashboard.types';

import {
  clampPercent,
  formatDate,
  formatRoleCategory,
  NUMBER_FORMATTER,
} from '../_utils/formatters';

interface DashboardCurrentRoadmapProps {
  roadmap: DashboardRoadmap | null;
}

function Metric({
  description,
  icon,
  label,
  value,
}: {
  description: string;
  icon: ComponentProps<typeof HugeiconsIcon>['icon'];
  label: string;
  value: string;
}) {
  return (
    <div className="bg-primary/5 flex min-w-0 gap-3 rounded-lg p-4">
      <div className="bg-background text-primary flex size-10 shrink-0 items-center justify-center rounded-md">
        <HugeiconsIcon className="size-5" icon={icon} />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-muted-foreground truncate text-xs">{label}</span>
        <span className="text-foreground truncate text-lg font-semibold">{value}</span>
        <span className="text-muted-foreground truncate text-xs">{description}</span>
      </div>
    </div>
  );
}

function MetadataItem({
  icon,
  label,
  value,
}: {
  icon: ComponentProps<typeof HugeiconsIcon>['icon'];
  label: string;
  value: string;
}) {
  return (
    <div className="border-border/70 flex min-w-0 items-center gap-3 border-t pt-3 md:border-t-0 md:border-l md:pt-0 md:pl-4 first:md:border-l-0 first:md:pl-0">
      <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-md">
        <HugeiconsIcon className="size-4" icon={icon} />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-muted-foreground truncate text-xs">{label}</span>
        <span className="text-foreground truncate text-sm leading-6 font-semibold">{value}</span>
      </div>
    </div>
  );
}

export function DashboardCurrentRoadmap({ roadmap }: DashboardCurrentRoadmapProps) {
  if (!roadmap) {
    return (
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Current roadmap</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-sm">
            No roadmap has been started yet. Generate a personalized roadmap to begin.
          </p>
        </CardContent>
        <CardFooter className="bg-transparent">
          <Button
            render={<Link href={'/roadmaps/generate' as Route<string>}>Generate roadmap</Link>}
          />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="h-full rounded-lg">
      <CardHeader>
        <CardTitle>Current roadmap</CardTitle>
        <CardAction>
          <Button
            size="sm"
            variant="default"
            render={
              <Link href={`/roadmaps/${roadmap.roadmapId}` as Route<string>}>
                View
                <HugeiconsIcon className="opacity-100" icon={ArrowRight02FreeIcons} />
              </Link>
            }
          />
        </CardAction>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={roadmap.isTemplate ? 'secondary' : 'default'}>
            {roadmap.isTemplate ? 'Template' : 'AI roadmap'}
          </Badge>
          <Badge variant="secondary">{formatRoleCategory(roadmap.roleCategory)}</Badge>
          {roadmap.timelineWarning?.isBehind ? (
            <Badge variant="destructive">
              <HugeiconsIcon data-icon="inline-start" icon={Alert02Icon} />
              Behind pace
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-7">
        <h2 className="text-heading text-2xl">{roadmap.title}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Metric
            label="Completion"
            description={`${roadmap.nodesCompleted} / ${roadmap.nodesTotal} nodes`}
            icon={Route01Icon}
            value={`${clampPercent(roadmap.completionPct)}%`}
          />
          <Metric
            label="Streak"
            description="Consecutive learning days"
            icon={FireIcon}
            value={`${NUMBER_FORMATTER.format(roadmap.streakDays)} day${
              roadmap.streakDays === 1 ? '' : 's'
            }`}
          />
          <Metric
            label="Skill readiness"
            description={`${clampPercent(roadmap.skillReadinessPct)}% skills`}
            icon={Target02Icon}
            value={`${clampPercent(roadmap.skillReadinessPct)}%`}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <MetadataItem
            label="Deadline"
            icon={Calendar03Icon}
            value={formatDate(roadmap.deadlineDate)}
          />
          <MetadataItem
            label="Estimated duration"
            icon={Clock01Icon}
            value={roadmap.estimatedWeeks ? `${roadmap.estimatedWeeks} weeks` : 'No estimate'}
          />
          <MetadataItem
            label="Started"
            icon={Route01Icon}
            value={roadmap.startedAt ? formatDate(roadmap.startedAt) : 'Not started'}
          />
        </div>
      </CardContent>
    </Card>
  );
}
