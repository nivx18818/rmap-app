import type { RoleCategory } from '@repo/db/prisma/client';

export interface TemplateRecommendationCategoryDto {
  category: RoleCategory;
  label: string;
}

export interface TemplateRecommendationRoadmapDto {
  roadmapId: string;
  title: string;
  description: null | string;
  goalName: null | string;
  roleCategory: RoleCategory;
  categoryLabel: string;
  estimatedWeeks: null | number;
  durationLabel: null | string;
  nodesTotal: number;
  requiredNodesTotal: number;
}

export interface TemplateRecommendationsResponseDto {
  roleCategories: TemplateRecommendationCategoryDto[];
  total: number;
  relevantRoadmaps: TemplateRecommendationRoadmapDto[];
}
