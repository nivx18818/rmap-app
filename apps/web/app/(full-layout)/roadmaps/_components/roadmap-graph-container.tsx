'use client';

import type { MockRoadmapLayout, MockRoadmapLogic } from '@/lib/data/roadmaps/roadmap-mock.types';

import { RoadmapGraphCanvas } from './roadmap-graph-canvas';

interface RoadmapGraphContainerProps {
  layout: MockRoadmapLayout;
  logic: MockRoadmapLogic;
}

export function RoadmapGraphContainer({ layout, logic }: RoadmapGraphContainerProps) {
  return <RoadmapGraphCanvas layout={layout} logic={logic} />;
}
