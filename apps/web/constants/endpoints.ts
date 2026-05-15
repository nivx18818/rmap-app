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
    nodes: (roadmapId: string) => `/roadmaps/${roadmapId}/nodes`,
  },
  users: {
    me: '/users/me',
  },
} as const;
