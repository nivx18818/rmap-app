export const API_BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH ?? '/api/v1';

export const ENDPOINTS = {
  admin: {
    skills: {
      byId: (skillId: string) => `/admin/skills/${skillId}`,
      list: '/admin/skills',
      resourceById: (skillId: string, resourceId: number) =>
        `/admin/skills/${skillId}/resources/${resourceId}`,
      resources: (skillId: string) => `/admin/skills/${skillId}/resources`,
    },
  },
  auth: {
    changePassword: '/auth/password',
    forgotPassword: '/auth/password/forgot',
    login: '/auth/login',
    logout: '/auth/logout',
    oauth: {
      github: '/auth/github',
      google: '/auth/google',
    },
    refresh: '/auth/refresh',
    register: '/auth/register',
    resetPassword: '/auth/password/reset',
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
  templates: {
    getById: (templateId: string) => `/templates/${templateId}`,
    list: '/templates',
    nodes: (templateId: string) => `/templates/${templateId}/nodes`,
  },
  users: {
    integrations: '/users/me/integrations',
    integrationByProvider: (provider: string) => `/users/me/integrations/${provider}`,
    me: '/users/me',
  },
} as const;
