export type RoleCategory =
  | 'ABSOLUTE_BEGINNERS'
  | 'AI_AND_MACHINE_LEARNING'
  | 'BEST_PRACTICES'
  | 'BLOCKCHAIN'
  | 'COMPUTER_SCIENCE'
  | 'CYBER_SECURITY'
  | 'DATA_ANALYSIS'
  | 'DATABASES'
  | 'DESIGN'
  | 'DEVOPS'
  | 'FRAMEWORKS'
  | 'GAME_DEVELOPMENT'
  | 'LANGUAGES_AND_PLATFORMS'
  | 'MANAGEMENT'
  | 'MOBILE_DEVELOPMENT'
  | 'WEB_DEVELOPMENT';

export type ResourceType = 'ARTICLE' | 'COURSE' | 'DOCS' | 'YOUTUBE';

export interface AdminSkill {
  createdAt: string;
  defaultEstimatedHours: null | number;
  description: null | string;
  id: string;
  name: string;
  roleCategory: null | RoleCategory;
  updatedAt: string;
}

export interface AdminSkillsListResponse {
  data: AdminSkill[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminSkillsQuery {
  page?: number;
  perPage?: number;
  q?: string;
  roleCategory?: RoleCategory;
}

export interface AdminSkillPayload {
  defaultEstimatedHours?: null | number;
  description?: null | string;
  name: string;
  roleCategory: RoleCategory;
}

export interface AdminSkillResource {
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

export interface AdminSkillResourcesResponse {
  resources: AdminSkillResource[];
  skillId: string;
}

export interface AdminSkillResourcePayload {
  isFree?: boolean;
  isPrimary?: boolean;
  resourceType: ResourceType;
  title: string;
  url: string;
}

export interface ApiErrorResponse {
  code?: number;
  errors?: Record<string, string[]>;
  message?: string;
}
