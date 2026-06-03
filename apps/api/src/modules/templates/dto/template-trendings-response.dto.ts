import type { RoleCategory } from '@repo/db/prisma/client';

export interface TemplateTrendingRoadmapDto {
  rank: number;
  roadmapId: string;
  title: string;
  roleCategory: RoleCategory;
  categoryLabel: string;
  estimatedWeeks: null | number;
  durationLabel: null | string;
  nodesTotal: number;
  trendText: string;
}

export interface TemplateTrendingsResponseDto {
  total: number;
  trendings: TemplateTrendingRoadmapDto[];
}
