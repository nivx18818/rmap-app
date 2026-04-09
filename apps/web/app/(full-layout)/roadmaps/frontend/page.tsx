import { notFound } from 'next/navigation';

import { FrontendRoadmapPage } from '@/components/roadmap/frontend-roadmap-page';
import { getRoadmapBySlug, getRoadmapProgressBySlug, mapRoadmapToHero } from '@/lib/data/roadmaps';

export default function FrontendRoadmapRoute() {
  const roadmap = getRoadmapBySlug('frontend');
  const progress = getRoadmapProgressBySlug('frontend');

  if (!roadmap) {
    notFound();
  }

  const hero = mapRoadmapToHero(roadmap, progress);

  return <FrontendRoadmapPage hero={hero} roadmap={roadmap} />;
}
