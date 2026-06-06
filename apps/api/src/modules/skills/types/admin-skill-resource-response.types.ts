import type { ResourceType } from '@repo/db/prisma/client';

export interface SkillResourceResponse {
  createdAt: string;
  id: number;
  isFree: boolean;
  isPrimary: boolean;
  resourceType: ResourceType;
  skillId: string;
  title: string;
  updatedAt: string;
  url: string;
}

export interface SkillResourceListResponse {
  resources: SkillResourceResponse[];
  skillId: string;
}
