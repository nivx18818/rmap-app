import { RoadmapDetailContent } from './_components/roadmap-detail-content';

export default async function RoadmapDetailPage(props: PageProps<'/roadmaps/[id]'>) {
  const { id } = await props.params;

  return <RoadmapDetailContent roadmapId={id} />;
}
