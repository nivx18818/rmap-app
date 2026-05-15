import { HeroGradient } from '@/components/shared/hero-gradient';
import { MaskBackground } from '@/components/shared/mask-background';
import { RainbowBar } from '@/components/shared/rainbow-bar';

import { RoadmapGraph } from './_components/roadmap-graph';
import { RoadmapHero } from './_components/roadmap-hero';

export default async function RoadmapDetailPage(props: PageProps<'/roadmaps/[id]'>) {
  const { id } = await props.params;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-start overflow-x-hidden">
      <MaskBackground />
      <HeroGradient />
      <RainbowBar />

      <RoadmapHero />
      <RoadmapGraph roadmapId={id} />
    </main>
  );
}
