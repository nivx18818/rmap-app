import { notFound } from 'next/navigation';

import type { MockRoadmapLayout, MockRoadmapLogic } from '@/lib/data/roadmaps/roadmap-mock.types';

import { HeroGradient } from '@/components/shared/hero-gradient';
import { RainbowBar } from '@/components/shared/rainbow-bar';

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
  'computer-science': {
    layout: () => import('@/lib/data/roadmaps/computer-science/computer-science-roadmaps.layout'),
    logic: () => import('@/lib/data/roadmaps/computer-science/computer-science-roadmaps.logic'),
  },
  'data-analyst': {
    layout: () => import('@/lib/data/roadmaps/data-analyst/data-analyst-roadmaps.layout'),
    logic: () => import('@/lib/data/roadmaps/data-analyst/data-analyst-roadmaps.logic'),
  },
  devops: {
    layout: () => import('@/lib/data/roadmaps/devops/devops-roadmaps.layout'),
    logic: () => import('@/lib/data/roadmaps/devops/devops-roadmaps.logic'),
  },
  frontend: {
    layout: () => import('@/lib/data/roadmaps/frontend-roadmap.layout'),
    logic: () => import('@/lib/data/roadmaps/frontend-roadmap.logic'),
  },
  'full-stack': {
    layout: () => import('@/lib/data/roadmaps/fullstack/fullstack-roadmap-layout'),
    logic: () => import('@/lib/data/roadmaps/fullstack/fullstack-roadmap.logic'),
  },
  angular: {
    layout: () => import('@/lib/data/roadmaps/angular/angular-roadmaps.layout'),
    logic: () => import('@/lib/data/roadmaps/angular/angular-roadmaps.logic'),
  },
  javascript: {
    layout: () => import('@/lib/data/roadmaps/javascript/javascript-roadmaps.layout'),
    logic: () => import('@/lib/data/roadmaps/javascript/javascript-roadmaps.logic'),
  },
  react: {
    layout: () => import('@/lib/data/roadmaps/react/react-roadmaps-layout'),
    logic: () => import('@/lib/data/roadmaps/react/react-roadmaps-logic'),
  },
  sql: {
    layout: () => import('@/lib/data/roadmaps/sql/sql-roadmaps.layout'),
    logic: () => import('@/lib/data/roadmaps/sql/sql-roadmaps.logic'),
  },
  vue: {
    layout: () => import('@/lib/data/roadmaps/vue/vue-roadmaps-layout'),
    logic: () => import('@/lib/data/roadmaps/vue/vue-roadmaps-logics'),
  },
};

async function loadMockRoadmapRouteData(id: string): Promise<MockRoadmapRouteData | null> {
  const resolvedRoadmapId = id in mockRoadmapModuleLoaders ? id : 'frontend';
  const moduleLoaders = mockRoadmapModuleLoaders[resolvedRoadmapId];

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

    if (layout.roadmapId !== resolvedRoadmapId || logic.roadmapId !== resolvedRoadmapId) {
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
      <HeroGradient />
      <RainbowBar />
      <RoadmapPageHero title={logic.title} description={logic.description} />

      <div className="mx-auto max-w-400 px-4 pt-2 pb-6 sm:px-6 lg:px-8">
        <RoadmapGraphContainer layout={layout} logic={logic} />
      </div>
    </main>
  );
}
