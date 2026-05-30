import type { RoadmapResponseDto } from '@/modules/roadmaps/dto/roadmap-response.dto';
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

export interface DashboardSummaryResponse {
  totalRoadmaps: number;
  activeRoadmaps: number;
  completedRoadmaps: number;
  totalSkills: number;
  completedSkills: number;
  inProgressSkills: number;
  lockedSkills: number;
  currentStreak: number;
}

export interface DashboardSkillCategoryResponse {
  category: RoadmapResponseDto['roleCategory'];
  label: string;
  totalSkills: number;
}

export interface DashboardRoadmapStatusResponse {
  behindPace: number;
  onTrack: number;
  completed: number;
  notStarted: number;
}

export interface DashboardActiveRoadmapResponse extends RoadmapProgressSummaryResponse {
  deadlineDate: null | string;
  estimatedWeeks: null | number;
  goalName: null | string;
  isTemplate: boolean;
  roleCategory: RoadmapResponseDto['roleCategory'];
  startedAt: null | string;
  title: string;
}

export interface DashboardResponse {
  userProfile: DashboardUserProfileResponse;
  activeRoadmaps: DashboardActiveRoadmapResponse[];
  userRoadmaps: RoadmapResponseDto[];
  streakDays: number;
  activityRecent: DailyActivityEntryResponse[];
  summary: DashboardSummaryResponse;
  skillCategories: DashboardSkillCategoryResponse[];
  roadmapStatus: DashboardRoadmapStatusResponse;
}
