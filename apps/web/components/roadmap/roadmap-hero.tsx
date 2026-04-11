import Link from 'next/link';

import type { RoadmapTheme } from '@/types/roadmap';

import { DownloadIcon, InfoIcon, SaveIcon, ShareIcon } from './roadmap-icons';

interface RoadmapHeroProps {
  allRoadmapsLabel: string;
  backHref: string;
  description: string;
  downloadLabel: string;
  progressHint: string;
  progressLabel: string;
  theme: RoadmapTheme;
  trackProgressLabel: string;
  title: string;
}

export function RoadmapHero({
  allRoadmapsLabel,
  backHref,
  description,
  downloadLabel,
  progressHint,
  progressLabel,
  theme,
  trackProgressLabel,
  title,
}: RoadmapHeroProps) {
  return (
    <div
      className="mx-auto flex w-full flex-col"
      style={{
        gap: theme.hero.container.gap,
        maxWidth: theme.hero.container.maxWidth,
        paddingBottom: theme.hero.container.paddingY,
        paddingLeft: theme.hero.container.paddingX,
        paddingRight: theme.hero.container.paddingX,
        paddingTop: theme.hero.container.paddingY,
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ height: theme.hero.toolbar.buttonHeight }}
      >
        <Link
          className="inline-flex h-full items-center font-medium"
          style={{
            color: theme.hero.typography.backlinkColor,
            fontSize: theme.hero.typography.progressFontSize,
            lineHeight: theme.hero.typography.progressLineHeight,
          }}
          href={backHref as Parameters<typeof Link>[0]['href']}
        >
          {allRoadmapsLabel}
        </Link>

        <div className="flex items-center" style={{ gap: theme.hero.toolbar.gap }}>
          <button
            className="btn-white flex items-center justify-center"
            style={{
              borderRadius: theme.hero.toolbar.radius,
              height: theme.hero.toolbar.buttonHeight,
              width: theme.hero.toolbar.iconButtonWidth,
            }}
          >
            <SaveIcon />
          </button>
          <button
            className="btn-white flex items-center font-medium"
            style={{
              borderRadius: theme.hero.toolbar.radius,
              color: theme.hero.typography.uiTextColor,
              fontSize: theme.hero.typography.progressFontSize,
              height: theme.hero.toolbar.buttonHeight,
              lineHeight: theme.hero.typography.progressLineHeight,
              paddingLeft: theme.hero.toolbar.buttonPaddingX,
              paddingRight: theme.hero.toolbar.buttonPaddingX,
            }}
          >
            <span>{downloadLabel}</span>
            <DownloadIcon />
          </button>
          <button
            className="btn-white flex items-center justify-center"
            style={{
              borderRadius: theme.hero.toolbar.radius,
              height: theme.hero.toolbar.buttonHeight,
              width: theme.hero.toolbar.iconButtonWidth,
            }}
          >
            <ShareIcon />
          </button>
        </div>
      </div>

      <h1
        className="font-heading leading-none font-semibold"
        style={{
          color: theme.hero.typography.titleColor,
          fontSize: theme.hero.typography.titleSize,
          lineHeight: theme.hero.typography.titleLineHeight,
        }}
      >
        {title}
      </h1>

      <p
        style={{
          color: theme.hero.typography.descriptionColor,
          fontSize: theme.hero.typography.bodyFontSize,
          lineHeight: theme.hero.typography.descriptionLineHeight,
        }}
      >
        {description}
      </p>

      <div
        className="flex items-center justify-between"
        style={{ gap: theme.hero.progressRow.gap, minHeight: theme.hero.progressRow.minHeight }}
      >
        <div className="flex min-w-0 items-center" style={{ gap: theme.hero.progressRow.hintGap }}>
          <span
            style={{
              background: theme.hero.badge.background,
              borderRadius: theme.hero.badge.radius,
              color: theme.hero.badge.color,
              fontSize: theme.hero.typography.progressFontSize,
              lineHeight: theme.hero.typography.progressLineHeight,
              paddingBottom: theme.hero.badge.paddingY,
              paddingLeft: theme.hero.badge.paddingX,
              paddingRight: theme.hero.badge.paddingX,
              paddingTop: theme.hero.badge.paddingY,
            }}
          >
            {progressLabel}
          </span>
          <span
            style={{
              color: theme.hero.typography.hintColor,
              fontSize: theme.hero.typography.progressFontSize,
              lineHeight: theme.hero.typography.progressLineHeight,
            }}
          >
            {progressHint}
          </span>
        </div>

        <div
          className="flex items-center font-medium"
          style={{
            color: theme.hero.typography.uiTextColor,
            fontSize: theme.hero.typography.progressFontSize,
            gap: theme.hero.progressRow.metaGap,
            lineHeight: theme.hero.typography.progressLineHeight,
          }}
        >
          <span>{trackProgressLabel}</span>
          <InfoIcon />
        </div>
      </div>
    </div>
  );
}
