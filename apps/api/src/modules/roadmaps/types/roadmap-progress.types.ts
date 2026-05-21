export interface TimelineWarningResponse {
  isBehind: boolean;
  paceDeficitPct: number;
  estimatedDelayDays: number;
  message: string;
}

export interface RoadmapProgressSummaryResponse {
  roadmapId: string;
  completionPct: number;
  streakDays: number;
  skillReadinessPct: number;
  nodesTotal: number;
  nodesCompleted: number;
  timelineWarning: TimelineWarningResponse | null;
}
