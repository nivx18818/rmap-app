import { ChartAnalysisIcon, FireIcon, Trophy } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/design-system/components/ui/tooltip';
import { cn } from '@repo/design-system/lib/utils';

import type { DailyActivityEntry, DashboardSummary } from '../../_types/dashboard.types';

import { NUMBER_FORMATTER } from '../../_utils/formatters';

interface SidebarRecentActivityProps {
  activityRecent: DailyActivityEntry[];
  summary: DashboardSummary;
}

export function SidebarRecentActivity({ activityRecent, summary }: SidebarRecentActivityProps) {
  const maxStreak = (() => {
    let max = 0;
    let current = 0;
    for (const day of activityRecent) {
      if (day.nodesCompleted > 0) {
        current++;
        max = Math.max(max, current);
      } else {
        current = 0;
      }
    }
    return Math.max(max, summary.currentStreak);
  })();

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon className="text-primary size-5" icon={ChartAnalysisIcon} />
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-4 px-6">
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-muted-foreground text-sm font-medium">Current streak</span>
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <HugeiconsIcon className="text-destructive size-4" icon={FireIcon} />
              <span className="text-primary">
                {NUMBER_FORMATTER.format(summary.currentStreak)}{' '}
                {summary.currentStreak === 1 || summary.currentStreak === 0 ? 'day' : 'days'}
              </span>
            </span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-muted-foreground text-sm font-medium">Longest streak</span>
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <HugeiconsIcon className="size-4 text-amber-500" icon={Trophy} />
              {NUMBER_FORMATTER.format(maxStreak)} day{maxStreak === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {activityRecent.length > 0 ? (
          <div className="flex flex-col gap-4">
            <TooltipProvider>
              <div className="grid grid-cols-10 gap-1 sm:gap-2">
                {activityRecent.map((day) => {
                  let bgColor = 'bg-secondary/60 hover:bg-secondary';
                  if (day.nodesCompleted === 1)
                    bgColor = 'bg-emerald-500/40 hover:bg-emerald-500/50';
                  else if (day.nodesCompleted === 2)
                    bgColor = 'bg-emerald-500/70 hover:bg-emerald-500/80';
                  else if (day.nodesCompleted >= 3) bgColor = 'bg-emerald-500 hover:bg-emerald-600';

                  const formattedDate = new Date(day.activityDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <Tooltip key={day.activityDate}>
                      <TooltipTrigger>
                        <div
                          className={cn(
                            'relative aspect-square w-full cursor-pointer rounded-sm border border-black/5 transition-all duration-200 hover:z-10 hover:scale-125 hover:shadow-sm dark:border-white/5',
                            bgColor,
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="text-xs" side="top">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-muted-foreground font-medium">{formattedDate}</span>
                          <span>
                            <strong>{day.nodesCompleted}</strong> nodes completed
                          </span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>

            <div className="text-muted-foreground flex items-center justify-end gap-2 text-xs">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="bg-secondary/60 size-3 rounded-[2px] border border-black/5 dark:border-white/5" />
                <div className="size-3 rounded-[2px] border border-black/5 bg-emerald-500/40 dark:border-white/5" />
                <div className="size-3 rounded-[2px] border border-black/5 bg-emerald-500/70 dark:border-white/5" />
                <div className="size-3 rounded-[2px] border border-black/5 bg-emerald-500 dark:border-white/5" />
              </div>
              <span>More</span>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No recent activity.</p>
        )}
      </CardContent>
    </Card>
  );
}
