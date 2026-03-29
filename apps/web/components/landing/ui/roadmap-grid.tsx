import type { RoadmapItemData } from '@/types/landing';

import { RoadmapItem } from './roadmap-item';

interface RoadmapGridProps {
  items: RoadmapItemData[];
}

export function RoadmapGrid({ items }: RoadmapGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <RoadmapItem key={item.label} {...item} />
      ))}
    </div>
  );
}
