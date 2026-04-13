import { notFound } from 'next/navigation';

import { RoadmapIntroCard } from '@/components/roadmap/roadmap-intro-card';
import { frontendRoadmapLayout } from '@/lib/data/roadmaps/frontend-roadmap.layout';
import { frontendRoadmapLogic } from '@/lib/data/roadmaps/frontend-roadmap.logic';
import { mockRoadmapPageContentBySlug } from '@/lib/data/roadmaps/roadmap-page-content';
import { mockRoadmapThemeBySlug } from '@/lib/data/roadmaps/roadmap-themes';

import { InteractiveRoadmapGraph } from '../_components/interactive-roadmap-graph';

export default function FrontendRoadmapRoute() {
  const frontendPageContent = mockRoadmapPageContentBySlug.frontend;
  const frontendTheme = mockRoadmapThemeBySlug.frontend;

  if (frontendRoadmapLogic.roadmapId !== 'frontend' || !frontendPageContent || !frontendTheme) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-400 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {frontendRoadmapLogic.title}
        </h1>
        <p className="mt-2 max-w-4xl text-xs text-slate-600 sm:text-sm">
          {frontendRoadmapLogic.description}
        </p>
      </section>

      <section className="mb-6">
        <RoadmapIntroCard {...frontendPageContent.introCard} theme={frontendTheme} />
      </section>

      <InteractiveRoadmapGraph
        layout={frontendRoadmapLayout}
        logic={frontendRoadmapLogic}
        nodePanel={frontendPageContent.nodePanel}
        theme={frontendTheme}
      />
    </main>
  );
}
