import { RoadmapNodeQuiz } from '../../../_components/roadmap-node-quiz';

export default async function RoadmapNodeQuizPage(
  props: PageProps<'/roadmaps/[id]/nodes/[nodeId]/quiz'>,
) {
  const { id, nodeId } = await props.params;

  return <RoadmapNodeQuiz nodeId={nodeId} roadmapId={id} />;
}
