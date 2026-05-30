import type { ComponentProps } from 'react';

import {
  CheckmarkCircle02Icon,
  DashboardSquare02Icon,
  Route01Icon,
  Target02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { cn } from '@repo/design-system/lib/utils';

import type { DashboardSummary } from '../../_types/dashboard.types';

import { NUMBER_FORMATTER } from '../../_utils/formatters';

function StatRow({
  icon,
  iconClassName,
  labelClassName,
  label,
  valueClassName,
  value,
}: {
  icon: ComponentProps<typeof HugeiconsIcon>['icon'];
  iconClassName: string;
  labelClassName?: string;
  label: string;
  valueClassName?: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={cn('text-muted-foreground flex min-w-0 items-center gap-2', labelClassName)}>
        <HugeiconsIcon className={`size-4 shrink-0 ${iconClassName}`} icon={icon} />
        <span className="truncate">{label}</span>
      </span>
      <span className={cn('text-foreground shrink-0 font-semibold', valueClassName)}>{value}</span>
    </div>
  );
}

interface SidebarLearningStatsProps {
  summary: DashboardSummary;
}

export function SidebarLearningStats({ summary }: SidebarLearningStatsProps) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon className="text-primary size-5" icon={DashboardSquare02Icon} />
          Learning stats
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <StatRow
          label="Total roadmaps"
          icon={Route01Icon}
          iconClassName="text-sky-500"
          value={NUMBER_FORMATTER.format(summary.totalRoadmaps)}
        />
        <StatRow
          label="Active roadmaps"
          icon={Target02Icon}
          iconClassName="text-amber-500"
          value={NUMBER_FORMATTER.format(summary.activeRoadmaps)}
        />
        <StatRow
          label="Completed roadmaps"
          icon={CheckmarkCircle02Icon}
          iconClassName="text-emerald-500"
          value={NUMBER_FORMATTER.format(summary.completedRoadmaps)}
        />
        <StatRow
          label="Total skills"
          icon={Target02Icon}
          iconClassName="text-blue-500"
          value={NUMBER_FORMATTER.format(summary.totalSkills)}
        />
        <StatRow
          label="Completed skills"
          icon={CheckmarkCircle02Icon}
          iconClassName="text-emerald-500"
          value={NUMBER_FORMATTER.format(summary.completedSkills)}
        />
      </CardContent>
    </Card>
  );
}
