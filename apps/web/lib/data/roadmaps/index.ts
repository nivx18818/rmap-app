import type { RoadmapHeroData, RoadmapProgress, RoadmapWithNodes } from '@/types/roadmap';

import { getMockRoadmapBySlug, mockRoadmapProgressResponse } from '@/lib/mocks/roadmaps/backend';

import { frontendMockData } from './frontend/frontend';

// Roadmap implementations

export { FRONTEND_ROADMAP } from './frontend';
export { frontendMockData } from './frontend/frontend';
export { getMockRoadmapBySlug, mockRoadmapProgressResponse } from '@/lib/mocks/roadmaps/backend';

const ROADMAPS_BY_SLUG = {
  frontend: frontendMockData,
} as const;

const ROADMAP_PROGRESS_BY_SLUG = {
  frontend: mockRoadmapProgressResponse,
} as const;

export function getRoadmapBySlug(slug: string) {
  return (
    getMockRoadmapBySlug(slug) ?? ROADMAPS_BY_SLUG[slug as keyof typeof ROADMAPS_BY_SLUG] ?? null
  );
}

export function getRoadmapProgressBySlug(slug: string) {
  return ROADMAP_PROGRESS_BY_SLUG[slug as keyof typeof ROADMAP_PROGRESS_BY_SLUG] ?? null;
}

function formatProgressLabel(progress: RoadmapProgress | null) {
  const completionPercentage = progress?.completion_percentage ?? 0;

  return `${Math.round(completionPercentage)}% DONE`;
}

export function mapRoadmapToHero(
  roadmap: RoadmapWithNodes,
  progress: RoadmapProgress | null,
): RoadmapHeroData {
  return {
    backHref: '/roadmaps',
    description:
      roadmap.description ?? `Personalized roadmap for ${roadmap.role_name.toLowerCase()}.`,
    progressHint: 'Click nodes to track your progress',
    progressLabel: formatProgressLabel(progress),
  };
}
