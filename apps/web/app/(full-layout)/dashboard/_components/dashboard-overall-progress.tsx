import { Target02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';

import type { DashboardSummary } from '../_types/dashboard.types';

import { clampPercent, NUMBER_FORMATTER } from '../_utils/formatters';

interface DashboardOverallProgressProps {
  summary: DashboardSummary;
}

const PROGRESS_STROKE_WIDTH = 11;

function getPercent(value: number, total: number): number {
  return total === 0 ? 0 : clampPercent((value / total) * 100);
}

function ProgressLegend({
  className,
  indicatorClassName,
  label,
  percent,
  value,
}: {
  className: string;
  indicatorClassName: string;
  label: string;
  percent: number;
  value: number;
}) {
  return (
    <div className="border-border/70 bg-background/70 flex items-center justify-between gap-4 rounded-md border px-3 py-2.5 text-sm">
      <span className="text-muted-foreground flex min-w-0 items-center gap-2">
        <span className={indicatorClassName} />
        <span className="truncate">{label}</span>
      </span>
      <span className={className}>
        {NUMBER_FORMATTER.format(value)}{' '}
        <span className="text-muted-foreground font-normal">({percent}%)</span>
      </span>
    </div>
  );
}

export function DashboardOverallProgress({ summary }: DashboardOverallProgressProps) {
  const totalSkills = summary.totalSkills;
  const completedPercent = getPercent(summary.completedSkills, totalSkills);
  const inProgressPercent = getPercent(summary.inProgressSkills, totalSkills);
  const lockedPercent = getPercent(summary.lockedSkills, totalSkills);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const completedDash = (completedPercent / 100) * circumference;
  const inProgressDash = (inProgressPercent / 100) * circumference;
  const lockedDash = Math.max(0, circumference - completedDash - inProgressDash);
  const progressSegments = [
    {
      dash: completedDash,
      offset: 0,
      stroke: '#7c3aed',
      type: 'completed',
    },
    {
      dash: inProgressDash,
      offset: -completedDash,
      stroke: '#818cf8',
      type: 'in-progress',
    },
    {
      dash: lockedDash,
      offset: -(completedDash + inProgressDash),
      stroke: '#e8e6f2',
      type: 'locked',
    },
  ].sort((first, second) => second.dash - first.dash);

  return (
    <Card className="h-full rounded-lg">
      <CardHeader>
        <CardTitle>Overall progress</CardTitle>
        <CardAction>
          <HugeiconsIcon className="text-primary size-5" icon={Target02Icon} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid flex-1 gap-5 pb-5 sm:grid-cols-[minmax(180px,0.9fr)_minmax(0,1fr)] sm:items-center xl:grid-cols-1 xl:grid-cols-[minmax(180px,0.9fr)_minmax(0,1fr)]">
        <div className="relative mx-auto size-48">
          <svg className="size-full -rotate-90" role="img" viewBox="0 0 160 160">
            <circle
              fill="none"
              stroke="#eeeaf7"
              cx="80"
              cy="80"
              r={radius}
              strokeWidth={PROGRESS_STROKE_WIDTH}
            />
            {progressSegments.map(({ dash, offset, stroke, type }) => (
              <circle
                key={type}
                fill="none"
                stroke={stroke}
                cx="80"
                cy="80"
                r={radius}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                strokeWidth={PROGRESS_STROKE_WIDTH}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-foreground text-3xl font-semibold">
              {NUMBER_FORMATTER.format(summary.completedSkills)}
              <span className="text-muted-foreground text-xl font-medium">
                {' '}
                / {NUMBER_FORMATTER.format(totalSkills)}
              </span>
            </span>
            <span className="text-2xl font-semibold text-violet-600">{completedPercent}%</span>
            <span className="text-muted-foreground text-xs">skills completed</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2.5">
          <ProgressLegend
            className="text-foreground shrink-0 font-semibold"
            label="Completed"
            indicatorClassName="size-3 rounded-full bg-violet-600"
            percent={completedPercent}
            value={summary.completedSkills}
          />
          <ProgressLegend
            className="text-foreground shrink-0 font-semibold"
            label="In progress"
            indicatorClassName="size-3 rounded-full bg-indigo-400"
            percent={inProgressPercent}
            value={summary.inProgressSkills}
          />
          <ProgressLegend
            className="text-foreground shrink-0 font-semibold"
            label="Locked"
            indicatorClassName="size-3 rounded-full bg-[#e8e6f2]"
            percent={lockedPercent}
            value={summary.lockedSkills}
          />
        </div>

        <p className="text-muted-foreground pt-1 text-center text-sm leading-6 sm:col-span-2 md:text-base xl:col-span-1 2xl:col-span-2">
          Keep learning. You&apos;re making steady progress.🎉
        </p>
      </CardContent>
    </Card>
  );
}
