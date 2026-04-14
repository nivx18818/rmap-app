import { Tick02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@repo/design-system/lib/utils';

const ROADMAP_LINK_ICON_BADGE_CLASS_BY_TONE = {
  green: 'roadmap-link-icon-green',
  purple: 'roadmap-link-icon-purple',
} as const;

const ROADMAP_LINK_ICON_GLYPH_CLASS_BY_TONE = {
  green: 'text-roadmap-link-green',
  purple: 'text-roadmap-link-purple',
} as const;

export function RoadmapLinkIcon({ tone }: { tone: 'green' | 'purple' }) {
  return (
    <span className={cn('roadmap-link-icon', ROADMAP_LINK_ICON_BADGE_CLASS_BY_TONE[tone])}>
      <HugeiconsIcon
        className={cn('roadmap-link-icon-glyph', ROADMAP_LINK_ICON_GLYPH_CLASS_BY_TONE[tone])}
        aria-hidden="true"
        icon={Tick02Icon}
      />
    </span>
  );
}
