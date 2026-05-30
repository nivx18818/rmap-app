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
  const activeRoadmaps = response.activeRoadmaps;
  const fullName = response.userProfile.fullName || 'User';
  const email = response.userProfile.email;
  const mapActivity = (activity: DashboardApiResponse['activityRecent'][number]) => ({
    activityDate: activity.activityDate,
    nodesCompleted: activity.nodesCompleted,
  });

  return {
    userProfile: {
      avatarUrl: response.userProfile.avatarUrl ?? buildDefaultAvatar(fullName || email),
      createdAt: response.userProfile.createdAt ?? '',
      email,
      fullName,
      id: response.userProfile.id,
      role: response.userProfile.role,
    },
    activeRoadmap: activeRoadmaps[0] ?? null,
    activeRoadmaps,
    userRoadmaps: response.userRoadmaps,
    streakDays: response.streakDays,
    activityRecent: response.activityRecent.map(mapActivity),
    summary: response.summary,
    skillCategories: response.skillCategories,
    roadmapStatus: response.roadmapStatus,
  };
}

export const dashboardService = {
  getDashboard: async () => {
    const response = await axiosInstance.get<DashboardApiResponse>(ENDPOINTS.dashboard);

    return mapDashboardResponse(response.data);
  },
};
