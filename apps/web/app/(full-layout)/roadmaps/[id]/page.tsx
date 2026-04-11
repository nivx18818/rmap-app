import { notFound } from 'next/navigation';

import { FrontendRoadmapPage } from '@/components/roadmap/frontend-roadmap-page';
import { getRoadmapWebModelBySlug } from '@/lib/data/roadmaps';

export default async function RoadmapDetailPage(props: PageProps<'/roadmaps/[id]'>) {
  const { id } = await props.params;
  const roadmapModel = getRoadmapWebModelBySlug(id);

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
