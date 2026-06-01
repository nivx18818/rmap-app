export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    register: '/auth/register',
  },
  dashboard: '/dashboard',
  onboarding: {
    goals: '/onboarding/goals',
    quiz: '/onboarding/quiz',
  },
  roadmaps: {
    generate: '/roadmaps/generate',
    getById: (roadmapId: string) => `/roadmaps/${roadmapId}`,
    nodeDetail: (roadmapId: string, nodeId: string) => `/roadmaps/${roadmapId}/nodes/${nodeId}`,
    latestMilestoneSubmission: (roadmapId: string, nodeId: string) =>
      `/roadmaps/${roadmapId}/nodes/${nodeId}/milestone-submissions/latest`,
    milestoneSubmissions: (roadmapId: string, nodeId: string) =>
      `/roadmaps/${roadmapId}/nodes/${nodeId}/milestone-submissions`,
    nodeProgress: (roadmapId: string, nodeId: string) =>
      `/roadmaps/${roadmapId}/nodes/${nodeId}/progress`,
    nodeQuiz: (roadmapId: string, nodeId: string) => `/roadmaps/${roadmapId}/nodes/${nodeId}/quiz`,
    nodes: (roadmapId: string) => `/roadmaps/${roadmapId}/nodes`,
    progress: (roadmapId: string) => `/roadmaps/${roadmapId}/progress`,
    startLearning: (roadmapId: string) => `/roadmaps/${roadmapId}/start`,
    submitNodeQuiz: (roadmapId: string, nodeId: string) =>
      `/roadmaps/${roadmapId}/nodes/${nodeId}/quiz/submit`,
  },
  users: {
    me: '/users/me',
  },
} as const;
