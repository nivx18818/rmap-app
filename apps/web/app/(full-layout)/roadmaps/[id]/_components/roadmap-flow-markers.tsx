'use client';

import { Award01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@repo/design-system/lib/utils';

import type { NodeType, ProgressStatus } from '../_types/roadmap-node.types';

import { milestoneMarkerClasses, skillMarkerClasses } from '../_constants/roadmap-flow.constants';

type SkillMarkerPosition = 'left' | 'right' | 'static';
type SkillMarkerSize = 'sm' | 'md';

const skillMarkerSizeClasses = {
  md: 'size-5',
  sm: 'size-4.5',
} as const satisfies Record<SkillMarkerSize, string>;

const skillMarkerPositionClasses = {
  left: 'absolute top-1/2 -left-2.5 z-10 -translate-y-1/2',
  right: 'absolute top-1/2 -right-2.5 z-10 -translate-y-1/2',
  static: '',
} as const satisfies Record<SkillMarkerPosition, string>;

interface SkillCheckMarkerProps {
  nodeType: Extract<NodeType, 'OPTIONAL' | 'REQUIRED'>;
  position?: SkillMarkerPosition;
  size?: SkillMarkerSize;
}

export function SkillCheckMarker({
  nodeType,
  position = 'right',
  size = 'sm',
}: SkillCheckMarkerProps) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center drop-shadow-[0_1px_2px_rgba(17,24,39,0.22)]',
        skillMarkerClasses[nodeType],
        skillMarkerSizeClasses[size],
        skillMarkerPositionClasses[position],
      )}
      aria-hidden="true"
    >
      <svg className="size-full" fill="none" aria-hidden="true" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          clipRule="evenodd"
          d="M1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25C6.06294 1.25 1.25 6.06294 1.25 12Z"
          fillRule="evenodd"
        />
        <path
          fill="#ffffff"
          clipRule="evenodd"
          d="M16.6757 8.26285C17.0828 8.63604 17.1103 9.26861 16.7372 9.67573L11.2372 15.6757C11.0528 15.8768 10.7944 15.9938 10.5217 15.9998C10.249 16.0057 9.98576 15.9 9.79289 15.7071L7.29289 13.2071C6.90237 12.8166 6.90237 12.1834 7.29289 11.7929C7.68342 11.4024 8.31658 11.4024 8.70711 11.7929L10.4686 13.5544L15.2628 8.32428C15.636 7.91716 16.2686 7.88966 16.6757 8.26285Z"
          fillRule="evenodd"
        />
      </svg>
    </span>
  );
}

type MilestoneMarkerPosition = 'node' | 'static';

interface MilestoneMarkerProps {
  position?: MilestoneMarkerPosition;
  status: ProgressStatus;
}

export function MilestoneMarker({ position = 'node', status }: MilestoneMarkerProps) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        milestoneMarkerClasses[status],
        position === 'node'
          ? 'absolute top-1/2 -right-3 z-10 size-6 -translate-y-1/2 shadow-[0_1px_2px_rgba(17,24,39,0.22)]'
          : 'size-6 shadow-sm',
      )}
      aria-hidden="true"
    >
      <HugeiconsIcon className="size-3.5" icon={Award01Icon} />
    </span>
  );
}
