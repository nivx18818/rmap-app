import { notFound } from 'next/navigation';

import { FrontendRoadmapPage } from '@/components/roadmap/frontend-roadmap-page';
import { getRoadmapBySlug } from '@/lib/data/roadmaps';

export default async function RoadmapDetailPage(props: PageProps<'/roadmaps/[id]'>) {
  const { id } = await props.params;
  const roadmap = getRoadmapBySlug(id);

  if (!roadmap) {
    notFound();
  }

  return <FrontendRoadmapPage roadmap={roadmap} />;
}
