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
export type TemplateNodeType = 'GROUP' | 'MILESTONE' | 'OPTIONAL' | 'REQUIRED';
export type AdminActivityType = 'resource' | 'skill' | 'template' | 'template_node';

export interface AdminDashboardResponse {
  recentActivity: Array<{
    id: string;
    label: string;
    timestamp: string;
    type: AdminActivityType;
  }>;
  totals: {
    resources: number;
    skills: number;
    templateNodes: number;
    templates: number;
  };
}

export interface AdminBulkOperationResponse {
  failed: Array<{
    code?: string;
    id: string;
    message: string;
  }>;
  succeeded: string[];
}

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

export interface AdminTemplate {
  deadlineDate: null | string;
  description: null | string;
  estimatedWeeks: null | number;
  generatedAt: string;
  goalName: null | string;
  hoursPerDay: null | number;
  id: string;
  isTemplate: boolean;
  roleCategory: RoleCategory;
  startedAt: null | string;
  title: string;
  updatedAt: string;
  userId: null | string;
}

export interface AdminTemplatesListResponse {
  data: AdminTemplate[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminTemplatesQuery {
  page?: number;
  perPage?: number;
  q?: string;
  roleCategory?: RoleCategory;
}

export interface AdminTemplatePayload {
  description: string;
  estimatedWeeks?: null | number;
  roleCategory: RoleCategory;
  title: string;
}

export interface AdminTemplateNode {
  createdAt: string;
  description: null | string;
  estimatedHours: null | number;
  id: string;
  name: string;
  nodeType: TemplateNodeType;
  parentId: null | string;
  posX: number;
  posY: number;
  roadmapId: string;
  skillId: null | string;
}

export interface AdminTemplateNodesResponse {
  nodes: AdminTemplateNode[];
}

export interface AdminTemplateNodePayload {
  description?: null | string;
  estimatedHours?: null | number;
  name: string;
  nodeType: TemplateNodeType;
  parentId?: null | string;
  skillId?: null | string;
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
