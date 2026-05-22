export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    register: '/auth/register',
  },
  onboarding: {
    goals: '/onboarding/goals',
    quiz: '/onboarding/quiz',
  },
  roadmaps: {
    generate: '/roadmaps/generate',
    getById: (roadmapId: string) => `/roadmaps/${roadmapId}`,
    nodeDetail: (roadmapId: string, nodeId: string) => `/roadmaps/${roadmapId}/nodes/${nodeId}`,
    nodeProgress: (roadmapId: string, nodeId: string) =>
      `/roadmaps/${roadmapId}/nodes/${nodeId}/progress`,
    nodeQuiz: (roadmapId: string, nodeId: string) => `/roadmaps/${roadmapId}/nodes/${nodeId}/quiz`,
    nodes: (roadmapId: string) => `/roadmaps/${roadmapId}/nodes`,
    submitNodeQuiz: (roadmapId: string, nodeId: string) =>
      `/roadmaps/${roadmapId}/nodes/${nodeId}/quiz/submit`,
  },
  users: {
    me: '/users/me',
  },
} as const;
