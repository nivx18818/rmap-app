import { CheckmarkCircle03Icon, MapsIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import type { RoadmapTheme } from '@/types/roadmap';

export function IntroMapIcon() {
  return <HugeiconsIcon className="size-4" icon={MapsIcon} />;
}

export function IntroCheckIcon({ theme, tone }: { theme: RoadmapTheme; tone: 'green' | 'pink' }) {
  return (
    <HugeiconsIcon
      className="size-4"
      style={{ color: tone === 'green' ? theme.icon.introCheck.green : theme.icon.introCheck.pink }}
      aria-hidden="true"
      icon={CheckmarkCircle03Icon}
    />
  );
}

export function RoadmapLinkIcon({
  theme,
  tone,
}: {
  theme: RoadmapTheme;
  tone: 'green' | 'purple';
}) {
  const badgeBackground =
    tone === 'green'
      ? theme.icon.roadmapLink.badgeGreenSurface
      : theme.icon.roadmapLink.badgePurpleSurface;
  const badgeBorderColor =
    tone === 'green'
      ? theme.icon.roadmapLink.badgeGreenBorder
      : theme.icon.roadmapLink.badgePurpleBorder;
  const iconColor = tone === 'green' ? theme.icon.roadmapLink.green : theme.icon.roadmapLink.purple;

  return (
    <span
      className="inline-flex items-center justify-center rounded-full border"
      style={{
        background: badgeBackground,
        borderColor: badgeBorderColor,
        borderWidth: '2px',
        boxShadow: theme.icon.roadmapLink.shadow,
        height: theme.icon.roadmapLink.badgeSize,
        width: theme.icon.roadmapLink.badgeSize,
      }}
    >
      <HugeiconsIcon
        className="shrink-0"
        style={{
          color: iconColor,
          height: '10px',
          width: '10px',
        }}
        aria-hidden="true"
        icon={Tick02Icon}
      />
    </span>
  );
}
