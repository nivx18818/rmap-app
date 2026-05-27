import type { RoadmapProgressSummaryResponse } from '@/modules/roadmaps/types/roadmap-progress.types';

export interface DashboardUserProfileResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface DailyActivityEntryResponse {
  activityDate: string;
  nodesCompleted: number;
}

export interface ActivitySummaryResponse {
  streakDays: number;
  longestStreak: number;
  activity: DailyActivityEntryResponse[];
}

export interface DashboardResponse {
  user: DashboardUserProfileResponse;
  activeRoadmap: RoadmapProgressSummaryResponse | null;
  streakDays: number;
  activityRecent: DailyActivityEntryResponse[];
}
