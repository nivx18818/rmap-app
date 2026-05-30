import { Target02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';

import type { DashboardRoadmapStatus } from '../../_types/dashboard.types';

import { NUMBER_FORMATTER } from '../../_utils/formatters';

function StatusRow({
  className,
  label,
  value,
}: {
  className: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground flex min-w-0 items-center gap-2">
        <span className={className} />
        <span className="truncate">{label}</span>
      </span>
      <span className="text-foreground shrink-0 font-semibold">
        {NUMBER_FORMATTER.format(value)}
      </span>
    </div>
  );
}

interface SidebarRoadmapStatusProps {
  roadmapStatus: DashboardRoadmapStatus;
}

export function SidebarRoadmapStatus({ roadmapStatus }: SidebarRoadmapStatusProps) {
  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon className="text-primary size-5" icon={Target02Icon} />
          Roadmap status
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <StatusRow
          className="bg-destructive size-2.5 rounded-full"
          label="Behind pace"
          value={roadmapStatus.behindPace}
        />
        <StatusRow
          className="size-2.5 rounded-full bg-emerald-500"
          label="On track"
          value={roadmapStatus.onTrack}
        />
        <StatusRow
          className="bg-primary size-2.5 rounded-full"
          label="Completed"
          value={roadmapStatus.completed}
        />
        <StatusRow
          className="bg-muted-foreground/40 size-2.5 rounded-full"
          label="Not started"
          value={roadmapStatus.notStarted}
        />
      </CardContent>
    </Card>
  );
}
