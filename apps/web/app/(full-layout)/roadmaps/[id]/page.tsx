import { notFound } from 'next/navigation';

import type { MockRoadmapLayout, MockRoadmapLogic } from '@/lib/data/roadmaps/roadmap-mock.types';

import { RoadmapGraphContainer } from '../_components/roadmap-graph-container';
import { RoadmapPageHero } from '../_components/roadmap-page-hero';

interface MockRoadmapRouteData {
  layout: MockRoadmapLayout;
  logic: MockRoadmapLogic;
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
  const moduleLoaders = mockRoadmapModuleLoaders[id];

  if (!moduleLoaders) {
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

  const { layout, logic } = routeData;

  return (
    <main className="pt-full-layout-header-offset">
      <RoadmapPageHero title={logic.title} description={logic.description} />

      <div className="mx-auto max-w-400 px-4 pt-2 pb-6 sm:px-6 lg:px-8">
        <RoadmapGraphContainer layout={layout} logic={logic} />
      </div>
    </main>
  );
}
