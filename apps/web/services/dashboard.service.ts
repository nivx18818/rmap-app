import type {
  Dashboard,
  DashboardApiResponse,
} from '@/app/(full-layout)/dashboard/_types/dashboard.types';

import { ENDPOINTS } from '@/constants/endpoints';
import { axiosInstance } from '@/lib/axios-instance';
import { buildDefaultAvatar } from '@/utils/user';

function mapDashboardResponse(response: DashboardApiResponse): Dashboard {
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
    activeRoadmap: response.roadmaps.find((roadmap) => roadmap.startedAt !== null) ?? null,
    roadmaps: response.roadmaps,
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
