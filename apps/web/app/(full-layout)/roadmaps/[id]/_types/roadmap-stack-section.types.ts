import type { RoadmapNode } from './roadmap-node.types';

export interface RoadmapStackSection {
  children: RoadmapNode[];
  id: string;
  node: RoadmapNode | null;
  title: string;
  type: 'group' | 'milestone' | 'orphan';
}
