export type NodeType = 'GROUP' | 'MILESTONE' | 'REQUIRED' | 'OPTIONAL';
export type ProgressStatus = 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED';

export interface NodeProgress {
  id: string;
  roadmapNodeId: string;
  status: ProgressStatus;
  startedAt: string | null;
  completedAt: string | null;
  quizScorePct: number | null;
  quizPassed: boolean | null;
  updatedAt?: string;
}

export interface RoadmapNode {
  id: string;
  roadmapId: string;
  parentId: string | null;
  skillId: string | null;
  name: string;
  description: string | null;
  nodeType: NodeType;
  estimatedHours: number | null;
  posX: number;
  posY: number;
  createdAt?: string;
  progress: NodeProgress | null;
}

export interface RoadmapNodesFilter {
  nodeType?: NodeType;
  status?: ProgressStatus;
  q?: string;
}

export interface RoadmapNodesResponse {
  nodes: RoadmapNode[];
}
