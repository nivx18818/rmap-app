import type { NodeType, RoleCategory } from '@repo/db/prisma/client';

export interface DashboardHomePlanNodeResponse {
  id: string;
  name: string;
  description: null | string;
  nodeType: NodeType;
  estimatedHours: number;
}

export interface DashboardHomeChapterResponse {
  current: number;
  total: number;
  label: string;
}

export interface DashboardHomeProgressResponse {
  requiredNodesCompleted: number;
  requiredNodesTotal: number;
  requiredCompletionPct: number;
}

export interface DashboardHomePaceWarningResponse {
  isBehind: boolean;
  paceDeficitPct: number;
  estimatedDelayDays: number;
  title: string;
  message: string;
  actionLabel: string;
}

export interface DashboardHomeRoadmapResponse {
  roadmapId: string;
  title: string;
  goalName: null | string;
  isTemplate: boolean;
  roleCategory: RoleCategory;
  startedAt: string;
  currentGroup: {
    id: string;
    name: string;
  } | null;
  planNode: DashboardHomePlanNodeResponse | null;
  chapter: DashboardHomeChapterResponse;
  progress: DashboardHomeProgressResponse;
  nextUnlock: {
    id: string;
    name: string;
  } | null;
  paceWarning: DashboardHomePaceWarningResponse | null;
}

export interface DashboardHomeMetricsResponse {
  roadmapCompletionPct: number;
  streakDays: number;
  readinessPct: number;
}

export interface DashboardHomeResponse {
  activeRoadmaps: DashboardHomeRoadmapResponse[];
  metrics: DashboardHomeMetricsResponse;
}
