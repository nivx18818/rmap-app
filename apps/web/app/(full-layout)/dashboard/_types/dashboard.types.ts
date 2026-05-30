import type { RoadmapDetail } from '../../../(full-layout)/roadmaps/[id]/_types/roadmap-detail.types';
import type { RoadmapProgressSummary } from '../../../(full-layout)/roadmaps/[id]/_types/roadmap-progress.types';

export interface DashboardUserProfileApiResponse {
  avatarUrl?: null | string;
  avatar_url?: null | string;
  id: string;
  email: string;
  fullName: string;
  full_name?: string;
  role: string;
  createdAt: string;
  created_at?: string;
}

export interface DailyActivityEntryApiResponse {
  activity_date: string;
  nodes_completed: number;
}

export interface DashboardSummaryApiResponse {
  totalRoadmaps: number;
  activeRoadmaps: number;
  completedRoadmaps: number;
  totalSkills: number;
  completedSkills: number;
  inProgressSkills: number;
  lockedSkills: number;
  currentStreak: number;
}

export interface DashboardSkillCategoryApiResponse {
  category: string;
  label: string;
  totalSkills: number;
}

export interface DashboardRoadmapStatusApiResponse {
  behindPace: number;
  onTrack: number;
  completed: number;
  notStarted: number;
}

export interface DashboardActiveRoadmap extends RoadmapProgressSummary {
  deadlineDate: null | string;
  estimatedWeeks: null | number;
  goalName: null | string;
  isTemplate: boolean;
  roleCategory: string;
  startedAt: null | string;
  title: string;
}

export interface DashboardApiResponse {
  user_profile: DashboardUserProfileApiResponse;
  active_roadmap: DashboardActiveRoadmap[];
  user_roadmap: RoadmapDetail[];
  streak_days: number;
  activity_recent: DailyActivityEntryApiResponse[];
  summary: DashboardSummaryApiResponse;
  skill_categories: DashboardSkillCategoryApiResponse[];
  roadmap_status: DashboardRoadmapStatusApiResponse;
}

export interface DashboardUserProfile {
  avatarUrl: string;
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface DailyActivityEntry {
  activityDate: string;
  nodesCompleted: number;
}

export interface DashboardSummary {
  totalRoadmaps: number;
  activeRoadmaps: number;
  completedRoadmaps: number;
  totalSkills: number;
  completedSkills: number;
  inProgressSkills: number;
  lockedSkills: number;
  currentStreak: number;
}

export interface DashboardSkillCategory {
  category: string;
  label: string;
  totalSkills: number;
}

export interface DashboardRoadmapStatus {
  behindPace: number;
  onTrack: number;
  completed: number;
  notStarted: number;
}

export interface Dashboard {
  userProfile: DashboardUserProfile;
  activeRoadmap: DashboardActiveRoadmap | null;
  activeRoadmaps: DashboardActiveRoadmap[];
  userRoadmaps: RoadmapDetail[];
  streakDays: number;
  activityRecent: DailyActivityEntry[];
  summary: DashboardSummary;
  skillCategories: DashboardSkillCategory[];
  roadmapStatus: DashboardRoadmapStatus;
}
