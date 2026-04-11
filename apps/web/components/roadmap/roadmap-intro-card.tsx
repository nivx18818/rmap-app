import { ArrowRight, ArrowRight02FreeIcons } from '@hugeicons/core-free-icons';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { Button } from '@repo/design-system/components/ui/button';
import { cn } from '@repo/design-system/lib/utils';
import Link from 'next/link';

import type { RoadmapIntroCardData, RoadmapTheme } from '@/types/roadmap';

import { IntroCheckIcon, IntroMapIcon } from './roadmap-icons';

export function RoadmapIntroCard({
  ctaHref,
  ctaLabel,
  description,
  items,
  theme,
  title,
}: RoadmapIntroCardData & { theme: RoadmapTheme }) {
  return (
    <div
      className="mx-auto w-full"
      style={{
        maxWidth: theme.introCard.card.maxWidth,
        paddingBottom: theme.introCard.card.paddingY,
        paddingLeft: theme.introCard.card.paddingX,
        paddingRight: theme.introCard.card.paddingX,
        paddingTop: theme.introCard.card.paddingY,
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          background: theme.introCard.card.background,
          borderRadius: theme.introCard.card.borderRadius,
          boxShadow: theme.introCard.card.insetBorder,
          padding: theme.introCard.card.padding,
        }}
      >
        <div
          className="grid items-center justify-between"
          style={{
            gap: theme.introCard.layout.columnGap,
            gridTemplateColumns: theme.introCard.layout.gridColumns,
          }}
        >
          <div className="relative" style={{ height: theme.introCard.illustration.height }}>
            <div
              className="absolute top-0 w-px"
              style={{
                background: theme.introCard.illustration.branchLineColor,
                height: theme.introCard.illustration.height,
                left: theme.introCard.illustration.lineLeft,
              }}
            />
            {items.map((item, index) => (
              <div
                key={item.id}
                className="absolute left-0 w-full"
                style={{
                  height: `${theme.introCard.illustration.itemHeight}px`,
                  top: `${theme.introCard.illustration.itemOffsetTop + index * theme.introCard.illustration.itemHeight}px`,
                }}
              >
                <div
                  className="absolute top-0 left-0 h-px w-full"
                  style={{ background: theme.introCard.illustration.rowLineColor }}
                />
                <div
                  className="absolute top-1/2 h-px -translate-y-1/2"
                  style={{
                    background: theme.introCard.illustration.accentLineColor,
                    left: theme.introCard.illustration.lineLeft,
                    width: theme.introCard.illustration.lineWidth,
                  }}
                />
                <div
                  className="absolute text-black"
                  style={{
                    left: theme.introCard.illustration.trackLeft,
                    top: theme.introCard.illustration.iconTop,
                  }}
                >
                  {item.variant === 'map' ? (
                    <IntroMapIcon />
                  ) : (
                    <IntroCheckIcon theme={theme} tone={item.tone === 'green' ? 'green' : 'pink'} />
                  )}
                </div>
                <div
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 text-black',
                    item.variant === 'map' ? 'font-semibold' : 'font-medium',
                  )}
                  style={{
                    fontSize: theme.introCard.typography.itemFontSize,
                    left: theme.introCard.illustration.textLeft,
                    lineHeight: theme.introCard.typography.itemLineHeight,
                  }}
                >
                  {item.label}
                </div>
              </div>
            ))}
            <div
              className="absolute left-0 h-px w-full"
              style={{
                background: theme.introCard.illustration.rowLineColor,
                bottom: theme.introCard.illustration.trackBottom,
              }}
            />
          </div>

          <div
            className="flex flex-col justify-center"
            style={{ gap: theme.introCard.spacing.contentGap }}
          >
            <h2
              className="font-heading font-medium"
              style={{
                color: theme.introCard.typography.headingColor,
                fontSize: theme.introCard.typography.headingSize,
                letterSpacing: theme.introCard.typography.headingLetterSpacing,
                lineHeight: theme.introCard.typography.headingLineHeight,
              }}
            >
              {title.split('\n').map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>

            <p
              style={{
                color: theme.introCard.typography.bodyColor,
                fontSize: theme.introCard.typography.bodyFontSize,
                lineHeight: theme.introCard.typography.bodyLineHeight,
              }}
            >
              {description}
            </p>

            <div>
              <Button
                size="lg"
                className="group/btn rounded-full"
                style={{
                  paddingLeft: theme.introCard.spacing.ctaPaddingX,
                  paddingRight: theme.introCard.spacing.ctaPaddingX,
                }}
                render={<Link href={ctaHref as Parameters<typeof Link>[0]['href']} />}
              >
                {ctaLabel}
                <AnimatedIconSwap icon={ArrowRight} hoverIcon={ArrowRight02FreeIcons} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
