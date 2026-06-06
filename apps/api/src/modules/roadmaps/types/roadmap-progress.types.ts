import type { TimelineWarningResponse as CommonTimelineWarningResponse } from '@/common/utils/timeline-warning.util';

export type TimelineWarningResponse = CommonTimelineWarningResponse;

export interface RoadmapProgressSummaryResponse {
  roadmapId: string;
  completionPct: number;
  streakDays: number;
  skillReadinessPct: number;
  nodesTotal: number;
  nodesCompleted: number;
  timelineWarning: TimelineWarningResponse | null;
}
