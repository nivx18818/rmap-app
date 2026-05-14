import type { RoleCategory } from '@repo/db/prisma/client';

export interface PaginationMetaDto {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface RoadmapResponseDto {
  deadlineDate: null | string;
  description: null | string;
  estimatedWeeks: null | number;
  generatedAt: string;
  goalName: null | string;
  hoursPerDay: null | number;
  id: string;
  isTemplate: boolean;
  roleCategory: RoleCategory;
  title: string;
  updatedAt: string;
  userId: null | string;
}

export interface PaginatedRoadmapsResponseDto {
  data: RoadmapResponseDto[];
  meta: PaginationMetaDto;
}
