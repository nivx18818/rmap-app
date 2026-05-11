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

export interface SubmitQuizQuestionResultResponse {
  question_id: string;
  selected_option: string | null;
  correct_option: string;
  is_correct: boolean;
}

export interface SubmitQuizNodeProgressResponse {
  id: string;
  roadmap_node_id: string;
  status: NodeStatus;
  started_at: Date | null;
  completed_at: Date | null;
  quiz_score_pct: number | null;
  quiz_passed: boolean | null;
}

export interface SubmitQuizResponse {
  score_pct: number;
  passed: boolean;
  correct_count: number;
  total_questions: number;
  results: SubmitQuizQuestionResultResponse[];
  suggestion: string | null;
  node_progress: SubmitQuizNodeProgressResponse;
}
