import type { RoleCategory } from '@repo/db/prisma/client';

export interface SkillResponse {
  createdAt: string;
  defaultEstimatedHours: null | number;
  description: null | string;
  id: string;
  name: string;
  roleCategory: null | RoleCategory;
  updatedAt: string;
}

export interface SkillPrerequisiteSummaryResponse {
  name: string;
  skillId: string;
}

export interface SkillDetailResponse extends SkillResponse {
  prerequisites: SkillPrerequisiteSummaryResponse[];
}

export interface AdminSkillsListResponse {
  data: SkillResponse[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
