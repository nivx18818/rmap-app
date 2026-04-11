import type { RoadmapPageContentData, RoadmapPageData, RoadmapTheme } from '@/types/roadmap';

export function composeRoadmapPageData(
  content: RoadmapPageContentData,
  theme: RoadmapTheme,
): RoadmapPageData {
  return {
    ...content,
    theme,
  };
}
