import { cn } from '@repo/design-system/lib/utils';

import type { RoadmapItemData } from '@/app/(full-layout)/(home)/_types/landing';

import { RoadmapItem } from './roadmap-item';

interface RoadmapGridProps {
  className?: string;
  items: RoadmapItemData[];
}

export function RoadmapGrid({ className, items }: RoadmapGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {items.map((item) => (
        <RoadmapItem key={item.id ?? item.href ?? item.label} {...item} />
      ))}
    </div>
  );
}
