import type { ComponentProps } from 'react';

import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@repo/design-system/lib/utils';

type HugeiconsIconValue = ComponentProps<typeof HugeiconsIcon>['icon'];

interface DashboardMetricCardProps {
  description: string;
  icon: HugeiconsIconValue;
  label: string;
  progressValue?: number;
  value: string;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;

  return Math.min(100, Math.max(0, value));
}

export function DashboardMetricCard({
  description,
  icon,
  label,
  progressValue,
  value,
}: DashboardMetricCardProps) {
  const normalizedProgressValue =
    typeof progressValue === 'number' ? clampPercent(progressValue) : null;

  return (
    <article className="border-primary/10 bg-background/85 flex min-h-38 flex-col justify-between gap-5 rounded-lg border p-5 shadow-sm backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-muted-foreground text-sm font-medium">{label}</span>
          <span className="text-foreground text-3xl font-semibold tracking-normal">{value}</span>
        </div>
        <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
          <HugeiconsIcon className="size-5" icon={icon} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm leading-5">{description}</p>
        {normalizedProgressValue !== null ? (
          <div
            className="bg-primary/10 h-2 overflow-hidden rounded-full"
            role="img"
            aria-label={`${label}: ${normalizedProgressValue}%`}
          >
            <div
              className={cn('bg-primary h-full rounded-full transition-all duration-500')}
              style={{ width: `${normalizedProgressValue}%` }}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
