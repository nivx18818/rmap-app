export interface TimelineWarning {
  isBehind: boolean;
  paceDeficitPct: number;
  estimatedDelayDays: number;
  message: string;
}

export interface RoadmapProgressSummary {
  roadmapId: string;
  completionPct: number;
  streakDays: number;
  skillReadinessPct: number;
  nodesTotal: number;
  nodesCompleted: number;
  timelineWarning: TimelineWarning | null;
}
