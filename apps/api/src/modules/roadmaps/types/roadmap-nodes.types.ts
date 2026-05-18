import type { NodeStatus, NodeType } from '@repo/db/prisma/client';

export interface UserNodeProgressResponse {
  id: string;
  roadmapNodeId: string;
  status: NodeStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  quizScorePct: number | null;
  quizPassed: boolean | null;
}

export interface RoadmapNodeWithUserProgressResponse {
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
  progress: UserNodeProgressResponse | null;
}

export interface RoadmapNodesListResponse {
  nodes: RoadmapNodeWithUserProgressResponse[];
}

export interface UpdateNodeProgressResponse {
  progress: UserNodeProgressResponse;
  unlockedNodes: string[];
}
