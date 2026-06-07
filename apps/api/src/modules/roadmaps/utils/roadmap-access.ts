import type { Prisma } from '@repo/db/prisma/client';

export const getRoadmapAccessWhere = (
  userId: string,
  roadmapId: string,
): Prisma.RoadmapWhereInput => ({
  id: roadmapId,
  OR: [{ isTemplate: true }, { isTemplate: false, userId }],
});

export const getRoadmapRelationAccessWhere = (userId: string): Prisma.RoadmapWhereInput => ({
  OR: [{ isTemplate: true }, { isTemplate: false, userId }],
});
