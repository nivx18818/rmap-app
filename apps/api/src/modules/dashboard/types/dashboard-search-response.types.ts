import type { RoleCategory } from '@repo/db/prisma/client';

export interface DashboardSearchPaginationMetaResponse {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface DashboardSearchRoadmapResponse {
  roadmapId: string;
  title: string;
  description: null | string;
  goalName: null | string;
  isTemplate: boolean;
  roadmapType: 'ai' | 'template';
  roleCategory: RoleCategory;
  categoryLabel: string;
  estimatedWeeks: null | number;
  durationLabel: null | string;
}

export interface DashboardSearchSkillResponse {
  skillId: string;
  name: string;
  description: null | string;
  roleCategory: null | RoleCategory;
  categoryLabel: null | string;
  defaultEstimatedHours: null | number;
}

export interface DashboardSearchRoadmapsSectionResponse {
  data: DashboardSearchRoadmapResponse[];
  meta: DashboardSearchPaginationMetaResponse;
}

export interface DashboardSearchSkillsSectionResponse {
  data: DashboardSearchSkillResponse[];
  meta: DashboardSearchPaginationMetaResponse;
}

export interface DashboardSearchResponse {
  query: string;
  roadmaps: DashboardSearchRoadmapsSectionResponse;
  skills: DashboardSearchSkillsSectionResponse;
  meta: {
    totalResults: number;
    roadmapPageSize: number;
    skillPageSize: number;
  };
}
