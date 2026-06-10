import type { RoadmapTransaction } from './roadmap-records';

export async function acquireUserRoadmapLock(
  tx: RoadmapTransaction,
  userId: string,
  roadmapId: string,
): Promise<void> {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${userId}:${roadmapId}`}, 0))::text`;
}
