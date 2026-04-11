'use client';

import { ArrowRight, ArrowRight02FreeIcons } from '@hugeicons/core-free-icons';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { SectionContainer } from '@repo/design-system/components/common/section-container';
import { Button } from '@repo/design-system/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import type {
  RoadmapGraphNode,
  RoadmapPageData,
  RoadmapHeroData,
  RoadmapWithNodes,
} from '@/types/roadmap';

import { RoadmapGraph } from './roadmap-graph';
import { RoadmapHero } from './roadmap-hero';
import { RoadmapIntroCard } from './roadmap-intro-card';
import { RoadmapNodePanel } from './roadmap-node-panel';

interface FrontendRoadmapPageProps {
  graphNodes: RoadmapGraphNode[];
  hero: RoadmapHeroData;
  roadmap: RoadmapWithNodes;
  ui: RoadmapPageData;
}

export function FrontendRoadmapPage({ graphNodes, hero, roadmap, ui }: FrontendRoadmapPageProps) {
  const { theme } = ui;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = useMemo(
    () => graphNodes.find((node) => node.id === selectedNodeId) ?? null,
    [graphNodes, selectedNodeId],
  );

  return (
    <main className="overflow-hidden bg-white" style={{ paddingTop: theme.page.mainPaddingTop }}>
      <section className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{
            background: theme.page.heroBackground,
            height: theme.page.heroBackgroundHeight,
          }}
        />

        <SectionContainer className="relative">
          <div
            className="flex flex-col"
            style={{
              gap: theme.page.sectionGap,
              paddingBottom: theme.page.sectionPaddingTop,
              paddingTop: '34px',
            }}
          >
            <RoadmapHero
              title={roadmap.title}
              allRoadmapsLabel={hero.allRoadmapsLabel}
              backHref={hero.backHref}
              description={hero.description}
              downloadLabel={hero.downloadLabel}
              progressHint={hero.progressHint}
              progressLabel={hero.progressLabel}
              theme={theme}
              trackProgressLabel={hero.trackProgressLabel}
            />
            <RoadmapIntroCard {...ui.introCard} theme={theme} />
          </div>
        </SectionContainer>
      </section>

      <section className="relative" style={{ paddingBottom: theme.page.sectionPaddingBottom }}>
        <SectionContainer className="relative">
          <RoadmapGraph
            activeNodeId={selectedNodeId}
            graph={ui.graph}
            nodes={graphNodes}
            theme={theme}
            onNodeSelect={setSelectedNodeId}
          />
        </SectionContainer>
      </section>

      <section
        className="relative overflow-hidden"
        style={{
          background: theme.page.promoBackground,
          paddingBottom: theme.page.sectionPaddingBottom,
          paddingTop: theme.page.sectionPaddingBottom,
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 mx-auto"
          style={{
            background: theme.page.promoHighlight.background,
            filter: `blur(${theme.page.promoBlur})`,
            height: theme.page.promoHighlight.height,
            maxWidth: theme.page.promoHighlight.maxWidth,
            transform: `rotate(${theme.page.promoHighlight.rotate})`,
          }}
        />

        <SectionContainer className="relative">
          <div
            className="grid items-center backdrop-blur-sm"
            style={{
              background: theme.promoCard.card.background,
              border: `${theme.promoCard.card.borderWidth} solid ${theme.promoCard.card.borderColor}`,
              borderRadius: theme.promoCard.card.borderRadius,
              boxShadow: theme.promoCard.card.shadow,
              gap: '40px',
              gridTemplateColumns: theme.promoCard.card.gridColumns,
              padding: theme.promoCard.card.padding,
            }}
          >
            <div className="space-y-5">
              <h2
                className="font-heading font-medium"
                style={{
                  color: theme.promoCard.typography.headingColor,
                  fontSize: theme.promoCard.typography.headingSize,
                  letterSpacing: theme.promoCard.typography.headingLetterSpacing,
                  lineHeight: theme.promoCard.typography.headingLineHeight,
                }}
              >
                {ui.promoCard.title}
              </h2>
              <p
                className="max-w-xl text-base leading-7"
                style={{ color: theme.promoCard.typography.bodyColor }}
              >
                {ui.promoCard.description}
              </p>
              <Button
                size="lg"
                className="group/btn rounded-full"
                render={<Link href={ui.promoCard.ctaHref as Parameters<typeof Link>[0]['href']} />}
              >
                {ui.promoCard.ctaLabel}
                <AnimatedIconSwap icon={ArrowRight} hoverIcon={ArrowRight02FreeIcons} />
              </Button>
            </div>

            <div
              className="relative mx-auto w-full"
              style={{
                height: theme.promoCard.image.height,
                maxWidth: theme.promoCard.image.maxWidth,
              }}
            >
              <Image
                className="object-contain"
                style={{ filter: `drop-shadow(${theme.promoCard.image.dropShadow})` }}
                fill
                src={ui.promoCard.imageSrc}
                alt={ui.promoCard.imageAlt}
                sizes="(max-width: 1024px) 320px, 380px"
              />
            </div>
          </div>
        </SectionContainer>
      </section>

      {selectedNode ? (
        <RoadmapNodePanel
          key={selectedNode.id}
          aiTutorTabLabel={ui.nodePanel.aiTutorTabLabel}
          node={selectedNode}
          resourcesTabLabel={ui.nodePanel.resourcesTabLabel}
          statusLabels={ui.nodePanel.statusLabels}
          theme={theme}
          onClose={() => setSelectedNodeId(null)}
        />
      ) : null}
    </main>
  );
}
