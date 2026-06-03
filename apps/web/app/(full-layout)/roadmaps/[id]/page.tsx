import { decodeReadableUrlId } from '@/utils/roadmap-url';

import { RoadmapDetailContent } from './_components/roadmap-detail-content';

export default async function RoadmapDetailPage(props: PageProps<'/roadmaps/[id]'>) {
  const { id } = await props.params;
  const roadmapId = decodeReadableUrlId(id);

  return <RoadmapDetailContent roadmapId={roadmapId} />;
}
