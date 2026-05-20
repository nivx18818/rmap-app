import type { NodeType, ProgressStatus } from './roadmap-node.types';

export interface UpdateRoadmapFiltersOptions {
  nodeType?: NodeType | null;
  q?: string | null;
  status?: ProgressStatus | null;
}
