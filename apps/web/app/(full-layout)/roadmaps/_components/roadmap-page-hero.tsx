import type { Route } from 'next';

import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';

const ROADMAPS_INDEX_HREF = '/' satisfies Route;
const ROADMAPS_INDEX_LABEL = 'All Roadmaps';

type RoadmapPageHeroProps = {
  description: string;
  title: string;
};

export function RoadmapPageHero({ description, title }: RoadmapPageHeroProps) {
  return (
    <section className="roadmap-page-hero-content">
      <Link
        className="text-roadmap-connector-required mb-4 inline-flex items-center gap-1.5 text-sm font-medium"
        href={ROADMAPS_INDEX_HREF}
      >
        <HugeiconsIcon className="size-4" icon={ArrowLeft01Icon} />
        {ROADMAPS_INDEX_LABEL}
      </Link>

      <h1 className="text-roadmap-page-title text-3xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="text-roadmap-page-subtitle mt-2 max-w-4xl text-xs sm:text-sm">{description}</p>
    </section>
  );
}
