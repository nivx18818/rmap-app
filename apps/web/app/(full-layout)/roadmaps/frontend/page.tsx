import { notFound } from 'next/navigation';

import { FrontendRoadmapPage } from '@/components/roadmap/frontend-roadmap-page';
import { getRoadmapWebModelBySlug } from '@/lib/data/roadmaps';

export default function FrontendRoadmapRoute() {
  const roadmapModel = getRoadmapWebModelBySlug('frontend');

  if (!roadmapModel) {
    notFound();
  }

  return (
    <FrontendRoadmapPage
      graphNodes={roadmapModel.graphNodes}
      hero={roadmapModel.hero}
      roadmap={roadmapModel.roadmap}
      ui={roadmapModel.ui}
    />
  );
}
