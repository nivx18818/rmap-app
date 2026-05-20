'use client';

import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Separator } from '@repo/design-system/components/ui/separator';
import { cn } from '@repo/design-system/lib/utils';

import { HighlightedText } from '@/components/shared/highlighted-text';

import type { RoadmapStackSection } from '../_types/roadmap-stack-section.types';

import { STATUS_LABELS } from '../_constants/roadmap-node.constants';
import {
  milestoneIconClasses,
  milestoneTypeBadgeClasses,
  sectionClasses,
  statusBadgeClasses,
} from '../_constants/roadmap-stack-list.constants';
import { getMilestoneMedalIcon } from '../_utils/roadmap-stack-icon.utils';
import { getSectionDisplayStatus } from '../_utils/roadmap-stack-list.utils';
import { RoadmapStackChildList } from './roadmap-stack-child-list';

interface RoadmapStackMilestoneSectionProps {
  isFiltered: boolean;
  milestoneIndex: number;
  searchQuery?: string;
  section: RoadmapStackSection;
}

export function RoadmapStackMilestoneSection({
  isFiltered,
  milestoneIndex,
  searchQuery,
  section,
}: RoadmapStackMilestoneSectionProps) {
  const sectionStatus = getSectionDisplayStatus(section);
  const milestoneIcon = getMilestoneMedalIcon(milestoneIndex);

  return (
    <section className={cn('rounded-lg border px-4 py-4', sectionClasses.milestone[sectionStatus])}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full shadow-sm',
            milestoneIconClasses[sectionStatus],
          )}
        >
          <HugeiconsIcon size={22} icon={milestoneIcon} />
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-foreground text-sm font-semibold whitespace-normal">
            <HighlightedText query={searchQuery} text={section.title} />
          </span>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Badge variant="secondary" className={milestoneTypeBadgeClasses[sectionStatus]}>
              Milestone
            </Badge>
            <Badge variant="outline" className={statusBadgeClasses[sectionStatus]}>
              {STATUS_LABELS[sectionStatus]}
            </Badge>
          </div>
        </div>
      </div>
      {section.children.length > 0 ? (
        <>
          <Separator className="my-3" />
          <RoadmapStackChildList nodes={section.children} searchQuery={searchQuery} />
        </>
      ) : isFiltered ? (
        <p className="text-muted-foreground px-1 pt-3 text-sm">
          No matched lessons in this section.
        </p>
      ) : null}
    </section>
  );
}
