import { decodeReadableUrlId } from '@/utils/roadmap-url';

import { RoadmapNodeQuiz } from '../../../_components/roadmap-node-quiz';

export default async function RoadmapNodeQuizPage(
  props: PageProps<'/roadmaps/[id]/nodes/[nodeId]/quiz'>,
) {
  const { id, nodeId } = await props.params;
  const roadmapId = decodeReadableUrlId(id);
  const decodedNodeId = decodeReadableUrlId(nodeId);

  return (
    <RoadmapNodeQuiz
      nodeId={decodedNodeId}
      nodeSlug={nodeId}
      roadmapId={roadmapId}
      roadmapSlug={id}
    />
  );
}
