import { notFound } from 'next/navigation';

import type { MockRoadmapLayout, MockRoadmapLogic } from '@/lib/data/roadmaps/roadmap-mock.types';
import type { RoadmapTheme } from '@/types/roadmap';

import { RoadmapIntroCard } from '@/components/roadmap/roadmap-intro-card';
import { mockRoadmapThemeBySlug } from '@/lib/data/roadmaps/roadmap-themes';

import { RoadmapGraphContainer } from '../_components/roadmap-graph-container';

interface MockRoadmapRouteData {
  layout: MockRoadmapLayout;
  logic: MockRoadmapLogic;
  theme: RoadmapTheme;
}

const mockRoadmapModuleLoaders: Record<
  string,
  {
    layout: () => Promise<{ default: MockRoadmapLayout }>;
    logic: () => Promise<{ default: MockRoadmapLogic }>;
  }
> = {
  backend: {
    layout: () => import('@/lib/data/roadmaps/backend/backend-roadmap.layout'),
    logic: () => import('@/lib/data/roadmaps/backend/backend-roadmap.logic'),
  },
  frontend: {
    layout: () => import('@/lib/data/roadmaps/frontend-roadmap.layout'),
    logic: () => import('@/lib/data/roadmaps/frontend-roadmap.logic'),
  },
};

async function loadMockRoadmapRouteData(id: string): Promise<MockRoadmapRouteData | null> {
  const theme = mockRoadmapThemeBySlug[id];
  const moduleLoaders = mockRoadmapModuleLoaders[id];

  if (!theme || !moduleLoaders) {
    return null;
  }

  try {
    const [layoutModule, logicModule] = await Promise.all([
      moduleLoaders.layout(),
      moduleLoaders.logic(),
    ]);

    const layout = layoutModule.default;
    const logic = logicModule.default;

    if (!layout || !logic) {
      return null;
    }

    if (layout.roadmapId !== id || logic.roadmapId !== id) {
      return null;
    }

    return {
      layout,
      logic,
      theme,
    };
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  return Object.keys(mockRoadmapModuleLoaders).map((id) => ({ id }));
}

export default async function RoadmapDetailPage(props: PageProps<'/roadmaps/[id]'>) {
  const { id } = await props.params;
  const routeData = await loadMockRoadmapRouteData(id);

  if (!routeData) {
    notFound();
  }

  const { layout, logic, theme } = routeData;

  return (
    <main className="mx-auto max-w-400 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-5">
        <h1 className="text-roadmap-page-title text-3xl font-extrabold tracking-tight sm:text-4xl">
          {logic.title}
        </h1>
        <p className="text-roadmap-page-subtitle mt-2 max-w-4xl text-xs sm:text-sm">
          {logic.description}
        </p>
      </section>

      <section className="mb-6">
        <RoadmapIntroCard {...logic.introCard} theme={theme} />
      </section>

      <RoadmapGraphContainer
        layout={layout}
        logic={logic}
        nodePanel={logic.nodePanel}
        theme={theme}
      />
    </main>
  );
}
