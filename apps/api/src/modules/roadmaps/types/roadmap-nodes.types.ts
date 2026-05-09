import type { NodeStatus, NodeType } from '@repo/db/prisma/client';

export interface UserNodeProgressResponse {
  id: string;
  roadmap_node_id: string;
  status: NodeStatus;
  started_at: Date | null;
  completed_at: Date | null;
  quiz_score_pct: number | null;
  quiz_passed: boolean | null;
}

export interface RoadmapNodeWithUserProgressResponse {
  id: string;
  roadmap_id: string;
  parent_id: string | null;
  skill_id: string | null;
  name: string;
  description: string | null;
  node_type: NodeType;
  estimated_hours: number | null;
  pos_x: number;
  pos_y: number;
  progress: UserNodeProgressResponse | null;
}

export interface RoadmapNodesListResponse {
  nodes: RoadmapNodeWithUserProgressResponse[];
}
