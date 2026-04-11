import type { RoadmapProgress, RoadmapWithNodes, RoadmapWebModel } from '@/types/roadmap';

import { mockRoadmapResponseBySlug, mockRoadmapProgressBySlug } from './roadmap-api-mock-responses';
import { mapRoadmapResponseToWebModel } from './roadmap-mappers';
import { mockRoadmapPageContentBySlug } from './roadmap-page-content';
import { composeRoadmapPageData } from './roadmap-page-data';
import { mockRoadmapThemeBySlug } from './roadmap-themes';

function resolveMockRoadmapModel(identifier: string): RoadmapWebModel | null {
  const bySlug = mockRoadmapResponseBySlug[identifier];

  if (bySlug && mockRoadmapPageContentBySlug[identifier] && mockRoadmapThemeBySlug[identifier]) {
    return mapRoadmapResponseToWebModel(
      bySlug,
      mockRoadmapProgressBySlug[identifier] ?? null,
      composeRoadmapPageData(
        mockRoadmapPageContentBySlug[identifier],
        mockRoadmapThemeBySlug[identifier],
      ),
    );
  }

  const matchedEntry = Object.entries(mockRoadmapResponseBySlug).find(
    ([, roadmapResponse]) => roadmapResponse.id === identifier,
  );

  if (!matchedEntry) {
    return null;
  }

  const [slug, roadmapResponse] = matchedEntry;
  const pageContent = mockRoadmapPageContentBySlug[slug];
  const theme = mockRoadmapThemeBySlug[slug];

  if (!pageContent || !theme) {
    return null;
  }

  return mapRoadmapResponseToWebModel(
    roadmapResponse,
    mockRoadmapProgressBySlug[slug] ?? null,
    composeRoadmapPageData(pageContent, theme),
  );
}

export function getRoadmapWebModelBySlug(slug: string) {
  return resolveMockRoadmapModel(slug);
}

export function getRoadmapBySlug(slug: string): RoadmapWithNodes | null {
  return resolveMockRoadmapModel(slug)?.roadmap ?? null;
}

export function getRoadmapProgressBySlug(slug: string): RoadmapProgress | null {
  return resolveMockRoadmapModel(slug)?.progress ?? null;
}

export { mapRoadmapResponseToWebModel, mapRoadmapToHero } from './roadmap-mappers';
