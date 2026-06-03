import type { RoleCategory } from '@repo/db/prisma/client';

export interface TemplateCategoryDto {
  category: RoleCategory;
  label: string;
  templatesCount: number;
}

export interface TemplateCategoriesResponseDto {
  total: number;
  categories: TemplateCategoryDto[];
}
