'use client';

import { Badge } from '@repo/design-system/components/ui/badge';
import { cn } from '@repo/design-system/lib/utils';

import type { RoadmapStackSection } from '../_types/roadmap-stack-section.types';

import { RoadmapStackChildList } from './roadmap-stack-child-list';

interface RoadmapStackOrphanSectionProps {
  isFiltered: boolean;
  onNodeSelect?: (nodeId: string) => void;
  searchQuery?: string;
  section: RoadmapStackSection;
  shouldWrapOrphanList: boolean;
}

export function RoadmapStackOrphanSection({
  isFiltered,
  onNodeSelect,
  searchQuery,
  section,
  shouldWrapOrphanList,
}: RoadmapStackOrphanSectionProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-3',
        shouldWrapOrphanList ? 'border-border bg-background rounded-lg border shadow-sm' : '',
      )}
    >
      {isFiltered ? (
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-foreground text-sm font-semibold">{section.title}</h3>
          <Badge variant="secondary">{section.children.length} matched</Badge>
        </div>
      ) : null}
      <RoadmapStackChildList
        nodes={section.children}
        searchQuery={searchQuery}
        onNodeSelect={onNodeSelect}
      />
    </div>
  );
}
