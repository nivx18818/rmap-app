import Link from 'next/link';

import { DownloadIcon, InfoIcon, SaveIcon, ShareIcon } from './roadmap-icons';

interface RoadmapHeroProps {
  backHref: string;
  description: string;
  progressHint: string;
  progressLabel: string;
  title: string;
}

const ROADMAP_HERO_COPY = {
  allRoadmapsLabel: '← All Roadmaps',
  downloadLabel: 'Download',
  trackProgressLabel: 'Track Progress',
} as const;

const ROADMAP_HERO_STYLES = {
  actionButton: 'btn-white flex h-[38px] items-center justify-center rounded-[8px]',
  actionIconButton: 'btn-white flex h-[38px] w-[38px] items-center justify-center rounded-[8px]',
  actionTextButton:
    'btn-white flex h-[38px] items-center gap-2 rounded-[8px] px-4 text-[16px] leading-[1.4] font-medium text-[#0f172a]',
  backlink: 'inline-flex h-full items-center text-[16px] leading-[1.4] font-medium text-[#7c3aed]',
  container: 'mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-8 py-16',
  progressBadge: 'rounded-full bg-[#ede9fe] px-2 py-px text-[16px] leading-[1.4] text-[#7c3aed]',
  progressMeta:
    'hidden items-center gap-2 text-[16px] leading-[1.4] font-medium text-[#0f172a] lg:flex',
  progressRow: 'flex min-h-[20px] items-center justify-between gap-6',
  subtitle: 'text-[18px] leading-[1.7] text-[rgba(40,25,80,0.75)]',
  title: 'font-heading text-[48px] leading-none font-semibold text-black',
  toolbar: 'hidden items-center gap-3 md:flex',
  toolbarRow: 'flex h-[38px] items-center justify-between',
} as const;

export function RoadmapHero({
  backHref,
  description,
  progressHint,
  progressLabel,
  title,
}: RoadmapHeroProps) {
  return (
    <div className={ROADMAP_HERO_STYLES.container}>
      <div className={ROADMAP_HERO_STYLES.toolbarRow}>
        <Link
          className={ROADMAP_HERO_STYLES.backlink}
          href={backHref as Parameters<typeof Link>[0]['href']}
        >
          {ROADMAP_HERO_COPY.allRoadmapsLabel}
        </Link>

        <div className={ROADMAP_HERO_STYLES.toolbar}>
          <button className={ROADMAP_HERO_STYLES.actionIconButton}>
            <SaveIcon />
          </button>
          <button className={ROADMAP_HERO_STYLES.actionTextButton}>
            <span>{ROADMAP_HERO_COPY.downloadLabel}</span>
            <DownloadIcon />
          </button>
          <button className={ROADMAP_HERO_STYLES.actionIconButton}>
            <ShareIcon />
          </button>
        </div>
      </div>

      <h1 className={ROADMAP_HERO_STYLES.title}>{title}</h1>

      <p className={ROADMAP_HERO_STYLES.subtitle}>{description}</p>

      <div className={ROADMAP_HERO_STYLES.progressRow}>
        <div className="flex min-w-0 items-center gap-3">
          <span className={ROADMAP_HERO_STYLES.progressBadge}>{progressLabel}</span>
          <span className="text-[16px] leading-[1.4] text-black">{progressHint}</span>
        </div>

        <div className={ROADMAP_HERO_STYLES.progressMeta}>
          <span>{ROADMAP_HERO_COPY.trackProgressLabel}</span>
          <InfoIcon />
        </div>
      </div>
    </div>
  );
}
