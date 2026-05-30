import type {
  Dashboard,
  DashboardApiResponse,
} from '@/app/(full-layout)/dashboard/_types/dashboard.types';

import { ENDPOINTS } from '@/constants/endpoints';
import { axiosInstance } from '@/lib/axios-instance';

function buildDefaultAvatar(seedSource: string) {
  const seed = encodeURIComponent(seedSource.trim() || 'user');

  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`;
}

function mapDashboardResponse(response: DashboardApiResponse): Dashboard {
  const activeRoadmaps = response.active_roadmap;
  const fullName = response.user_profile.fullName ?? response.user_profile.full_name ?? 'User';
  const email = response.user_profile.email;
  const mapActivity = (activity: DashboardApiResponse['activity_recent'][number]) => ({
    activityDate: activity.activity_date,
    nodesCompleted: activity.nodes_completed,
  });

  return {
    userProfile: {
      avatarUrl:
        response.user_profile.avatarUrl ??
        response.user_profile.avatar_url ??
        buildDefaultAvatar(fullName || email),
      createdAt: response.user_profile.createdAt ?? response.user_profile.created_at ?? '',
      email,
      fullName,
      id: response.user_profile.id,
      role: response.user_profile.role,
    },
    activeRoadmap: activeRoadmaps[0] ?? null,
    activeRoadmaps,
    userRoadmaps: response.user_roadmap,
    streakDays: response.streak_days,
    activityRecent: response.activity_recent.map(mapActivity),
    summary: response.summary,
    skillCategories: response.skill_categories,
    roadmapStatus: response.roadmap_status,
  };
}

export const dashboardService = {
  getDashboard: async () => {
    const response = await axiosInstance.get<DashboardApiResponse>(ENDPOINTS.dashboard);

    return mapDashboardResponse(response.data);
  },
};
