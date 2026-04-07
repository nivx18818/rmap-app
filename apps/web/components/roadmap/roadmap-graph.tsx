import type { RoadmapNode } from '@/types/roadmap';

import { RoadmapGraphDesktop } from './roadmap-graph-desktop';
import { RoadmapGraphMobile } from './roadmap-graph-mobile';

interface RoadmapGraphProps {
  nodes: RoadmapNode[];
}

export function RoadmapGraph({ nodes }: RoadmapGraphProps) {
  return (
    <>
      <RoadmapGraphDesktop nodes={nodes} />
      <RoadmapGraphMobile nodes={nodes} />
    </>
  );
}
