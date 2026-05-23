import type { RoadmapProgressSummaryResponse } from '@/modules/roadmaps/types/roadmap-progress.types';

export interface DashboardUserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface DailyActivityEntryResponse {
  activity_date: string;
  nodes_completed: number;
}

export interface DashboardResponse {
  user_profile: DashboardUserProfileResponse;
  active_roadmap: RoadmapProgressSummaryResponse | null;
  streak_days: number;
  activity_recent: DailyActivityEntryResponse[];
}
