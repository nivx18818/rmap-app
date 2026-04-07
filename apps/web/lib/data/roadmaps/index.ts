import { FRONTEND_ROADMAP } from './frontend';

// Roadmap implementations

export { frontendMockData } from './frontend/frontend';

export { FRONTEND_ROADMAP } from './frontend';

const ROADMAPS_BY_SLUG = {
  frontend: FRONTEND_ROADMAP,
} as const;

export function getRoadmapBySlug(slug: string) {
  return ROADMAPS_BY_SLUG[slug as keyof typeof ROADMAPS_BY_SLUG] ?? null;
}

// Shared data
export { SHARED_NODES } from './shared/nodes';
