import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@repo/design-system/lib/utils';
import Link from 'next/link';

import type { RoadmapItemData } from '@/app/(full-layout)/(home)/_types/landing';

type RoadmapItemProps = RoadmapItemData;

export function RoadmapItem({ label, href = '#', variant = 'default' }: RoadmapItemProps) {
  const isCreate = variant === 'create';

  return (
    <Link
      className={cn(
        'group focus-visible:ring-primary/30 flex h-12 items-center rounded-md border px-4 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:outline-hidden',
        isCreate
          ? 'text-primary justify-center border-dashed border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40 hover:bg-violet-500/10 hover:shadow-xs'
          : 'bg-background text-foreground justify-between border-[rgba(91,33,182,0.08)] hover:-translate-y-0.5 hover:border-[rgba(91,33,182,0.2)] hover:bg-slate-50 hover:shadow-sm',
      )}
      href={href as never}
    >
      <span className="whitespace-nowrap">{label}</span>
      {!isCreate && (
        <HugeiconsIcon
          className="text-muted-foreground group-hover:text-foreground size-3.5 shrink-0 opacity-60 transition-all duration-200 group-hover:opacity-100"
          icon={ArrowUpRight01Icon}
        />
      )}
    </Link>
  );
}
