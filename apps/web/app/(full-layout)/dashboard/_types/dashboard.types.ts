import type { TimelineWarning } from '../../../(full-layout)/roadmaps/[id]/_types/roadmap-progress.types';

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
  category:
    | 'ABSOLUTE_BEGINNERS'
    | 'AI_AND_MACHINE_LEARNING'
    | 'BEST_PRACTICES'
    | 'BLOCKCHAIN'
    | 'COMPUTER_SCIENCE'
    | 'CYBER_SECURITY'
    | 'DATA_ANALYSIS'
    | 'DATABASES'
    | 'DESIGN'
    | 'DEVOPS'
    | 'FRAMEWORKS'
    | 'GAME_DEVELOPMENT'
    | 'LANGUAGES_AND_PLATFORMS'
    | 'MANAGEMENT'
    | 'MOBILE_DEVELOPMENT'
    | 'WEB_DEVELOPMENT';
  label: string;
  completedSkills: number;
  totalSkills: number;
}

export interface DashboardRoadmapStatus {
  behindPace: number;
  onTrack: number;
  completed: number;
  notStarted: number;
}

export interface DashboardRoadmap {
  roadmapId: string;
  deadlineDate: null | string;
  description: null | string;
  estimatedWeeks: null | number;
  goalName: null | string;
  isTemplate: boolean;
  roleCategory: DashboardSkillCategory['category'];
  startedAt: null | string;
  title: string;
  completionPct: number;
  streakDays: number;
  skillReadinessPct: number;
  nodesTotal: number;
  nodesCompleted: number;
  timelineWarning: TimelineWarning | null;
}

export interface DashboardApiResponse {
  userProfile: DashboardUserProfile;
  roadmaps: DashboardRoadmap[];
  streakDays: number;
  activityRecent: DailyActivityEntry[];
  summary: DashboardSummary;
  skillCategories: DashboardSkillCategory[];
  roadmapStatus: DashboardRoadmapStatus;
}

export interface Dashboard {
  userProfile: DashboardUserProfile & {
    avatarUrl: string;
  };
  activeRoadmap: DashboardRoadmap | null;
  roadmaps: DashboardRoadmap[];
  streakDays: number;
  activityRecent: DailyActivityEntry[];
  summary: DashboardSummary;
  skillCategories: DashboardSkillCategory[];
  roadmapStatus: DashboardRoadmapStatus;
}
