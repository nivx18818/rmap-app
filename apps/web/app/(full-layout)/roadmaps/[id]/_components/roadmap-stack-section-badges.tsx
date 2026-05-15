'use client';

import { Badge } from '@repo/design-system/components/ui/badge';

import type { ProgressStatus } from '../_types/roadmap-node.types';

import { STATUS_LABELS } from '../_constants/roadmap-node.constants';
import { statusBadgeClasses } from '../_constants/roadmap-stack-list.constants';

interface RoadmapStackSectionBadgesProps {
  lessons: number;
  sectionStatus: ProgressStatus;
}

export function RoadmapStackSectionBadges({
  lessons,
  sectionStatus,
}: RoadmapStackSectionBadgesProps) {
  return (
    <>
      {lessons > 0 ? <Badge variant="outline">{lessons} lessons</Badge> : null}
      <Badge variant="outline" className={statusBadgeClasses[sectionStatus]}>
        {STATUS_LABELS[sectionStatus]}
      </Badge>
    </>
  );
}
