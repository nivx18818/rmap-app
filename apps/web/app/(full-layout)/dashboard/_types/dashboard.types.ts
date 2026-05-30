import type { RoadmapDetail } from '../../../(full-layout)/roadmaps/[id]/_types/roadmap-detail.types';
import type { RoadmapProgressSummary } from '../../../(full-layout)/roadmaps/[id]/_types/roadmap-progress.types';

export interface DashboardUserProfileApiResponse {
  avatarUrl?: null | string;
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export interface DailyActivityEntryApiResponse {
  activityDate: string;
  nodesCompleted: number;
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
  userProfile: DashboardUserProfileApiResponse;
  activeRoadmaps: DashboardActiveRoadmap[];
  userRoadmaps: RoadmapDetail[];
  streakDays: number;
  activityRecent: DailyActivityEntryApiResponse[];
  summary: DashboardSummaryApiResponse;
  skillCategories: DashboardSkillCategoryApiResponse[];
  roadmapStatus: DashboardRoadmapStatusApiResponse;
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
