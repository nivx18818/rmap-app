import type { RoadmapResponseDto } from '@/modules/roadmaps/dto/roadmap-response.dto';
import type { TimelineWarningResponse } from '@/modules/roadmaps/types/roadmap-progress.types';

export interface DashboardUserProfileResponse {
  avatarUrl: null | string;
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
  completedSkills: number;
  totalSkills: number;
}

export interface DashboardRoadmapStatusResponse {
  behindPace: number;
  onTrack: number;
  completed: number;
  notStarted: number;
}

export interface DashboardRoadmapResponse {
  roadmapId: string;
  deadlineDate: null | string;
  description: null | string;
  estimatedWeeks: null | number;
  goalName: null | string;
  isTemplate: boolean;
  roleCategory: RoadmapResponseDto['roleCategory'];
  startedAt: null | string;
  title: string;
  completionPct: number;
  streakDays: number;
  skillReadinessPct: number;
  nodesTotal: number;
  nodesCompleted: number;
  timelineWarning: TimelineWarningResponse | null;
}

export interface DashboardResponse {
  userProfile: DashboardUserProfileResponse;
  roadmaps: DashboardRoadmapResponse[];
  streakDays: number;
  activityRecent: DailyActivityEntryResponse[];
  summary: DashboardSummaryResponse;
  skillCategories: DashboardSkillCategoryResponse[];
  roadmapStatus: DashboardRoadmapStatusResponse;
}
