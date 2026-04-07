import Link from 'next/link';

import { DownloadIcon, InfoIcon, SaveIcon, ShareIcon } from './roadmap-icons';

interface RoadmapHeroProps {
  title: string;
}

export function RoadmapHero({ title }: RoadmapHeroProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-8 py-16">
      <div className="flex h-[38px] items-center justify-between">
        <Link
          className="inline-flex h-full items-center text-[16px] leading-[1.4] font-medium text-[#7c3aed]"
          href="/"
        >
          ← All Roadmaps
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <button className="btn-white flex h-[38px] w-[38px] items-center justify-center rounded-[8px]">
            <SaveIcon />
          </button>
          <button className="btn-white flex h-[38px] items-center gap-2 rounded-[8px] px-4 text-[16px] leading-[1.4] font-medium text-[#0f172a]">
            <span>Download</span>
            <DownloadIcon />
          </button>
          <button className="btn-white flex h-[38px] w-[38px] items-center justify-center rounded-[8px]">
            <ShareIcon />
          </button>
        </div>
      </div>

      <h1 className="font-heading text-[48px] leading-none font-semibold text-black">{title}</h1>

      <p className="text-[18px] leading-[1.7] text-[rgba(40,25,80,0.75)]">
        Step by step guide to becoming a modern frontend developer in 2026
      </p>

      <div className="flex min-h-[20px] items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="rounded-full bg-[#ede9fe] px-2 py-px text-[16px] leading-[1.4] text-[#7c3aed]">
            0% DONE
          </span>
          <span className="text-[16px] leading-[1.4] text-black">
            Click nodes to track your progress
          </span>
        </div>

        <div className="hidden items-center gap-2 text-[16px] leading-[1.4] font-medium text-[#0f172a] lg:flex">
          <span>Track Progress</span>
          <InfoIcon />
        </div>
      </div>
    </div>
  );
}
