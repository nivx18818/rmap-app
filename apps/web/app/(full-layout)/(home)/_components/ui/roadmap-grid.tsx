import type { RoadmapItemData } from '@/app/(full-layout)/(home)/_types/landing';

import { RoadmapItem } from './roadmap-item';

interface RoadmapGridProps {
  items: RoadmapItemData[];
}

export function RoadmapGrid({ items }: RoadmapGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <RoadmapItem key={item.id ?? item.href ?? item.label} {...item} />
      ))}
    </div>
  );
}
