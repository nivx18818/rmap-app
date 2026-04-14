import { ArrowLeft01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import type { MockRoadmapLayout, MockRoadmapLogic } from '@/lib/data/roadmaps/roadmap-mock.types';
import type { RoadmapTheme } from '@/types/roadmap';

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
    <main className="pt-full-layout-header-offset">
      <section className="roadmap-page-hero-content">
        <Link
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium"
          style={{ color: 'var(--color-roadmap-connector-required)' }}
          href={logic.hero.backHref as '/'}
        >
          <HugeiconsIcon className="size-4" icon={ArrowLeft01Icon} />
          {logic.hero.backLabel}
        </Link>

        <h1 className="text-roadmap-page-title text-3xl font-extrabold tracking-tight sm:text-4xl">
          {logic.title}
        </h1>
        <p className="text-roadmap-page-subtitle mt-2 max-w-4xl text-xs sm:text-sm">
          {logic.description}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-sm font-semibold"
              style={{
                background: 'var(--color-roadmap-panel-info-surface)',
                color: 'var(--color-roadmap-connector-required)',
              }}
            >
              {logic.hero.progressBadgeLabel}
            </span>
            <p className="text-roadmap-page-subtitle text-sm">{logic.hero.progressHint}</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-0!"
            style={{ color: 'var(--color-roadmap-title-foreground)' }}
          >
            <span>{logic.hero.progressActionLabel}</span>
            <HugeiconsIcon className="size-4" icon={InformationCircleIcon} />
          </Button>
        </div>
      </section>

      <div className="mx-auto max-w-400 px-4 pt-2 pb-6 sm:px-6 lg:px-8">
        <RoadmapGraphContainer
          layout={layout}
          logic={logic}
          nodePanel={logic.nodePanel}
          theme={theme}
        />
      </div>
    </main>
  );
}
