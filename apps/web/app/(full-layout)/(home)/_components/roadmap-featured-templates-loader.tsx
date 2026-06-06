import {
  ArrowUpRight01Icon,
  Award01Icon,
  BookHeartIcon,
  CalendarFavorite01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@repo/design-system/lib/utils';
import Link from 'next/link';

import type { RoadmapTemplate } from '@/app/(full-layout)/(home)/_types/landing';

import { templateService } from '@/services/template.service';
import { buildRoadmapHref } from '@/utils/roadmap-url';

import { formatRoadmapTemplateCategory } from '../_utils/roadmap-templates';

const FEATURED_TEMPLATE_COUNT = 8;
const FEATURED_TEMPLATES_ERROR_MESSAGE = 'Unable to load featured roadmap templates.';
const FEATURED_TEMPLATE_BADGES = [
  { className: 'text-featured-template-choice', icon: Award01Icon, label: "Developers' Choice" },
  { className: 'text-featured-template-featured', icon: CalendarFavorite01Icon, label: 'Featured' },
  { className: 'text-featured-template-recommended', icon: BookHeartIcon, label: 'Recommended' },
] as const;

export async function RoadmapFeaturedTemplatesLoader() {
  try {
    const templates = await templateService.getRandomTemplates(FEATURED_TEMPLATE_COUNT);

    if (!templates.length) {
      return <RoadmapFeaturedTemplatesStatus message="No roadmap templates are available yet." />;
    }

    return (
      <div className="flex w-full flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <FeaturedRoadmapCard key={template.id} template={template} />
          ))}
          <SeeAllTemplatesLink />
        </div>
      </div>
    );
  } catch {
    return <RoadmapFeaturedTemplatesStatus message={FEATURED_TEMPLATES_ERROR_MESSAGE} />;
  }
}

function SeeAllTemplatesLink() {
  return (
    <Link
      className="text-primary group/see-all focus-visible:ring-primary/30 border-primary/20 bg-primary/3 hover:border-primary/40 hover:bg-primary/10 flex min-h-38 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed px-8 text-sm font-medium transition-all duration-200 hover:-translate-y-1 hover:shadow-(--shadow-featured-template-card) focus-visible:ring-2 focus-visible:outline-hidden"
      href="/explore"
    >
      See All
      <HugeiconsIcon
        className="size-3.5 transition-transform duration-200 group-hover/see-all:translate-x-0.5 group-hover/see-all:-translate-y-0.5"
        icon={ArrowUpRight01Icon}
      />
    </Link>
  );
}

function FeaturedRoadmapCard({ template }: { template: RoadmapTemplate }) {
  const description =
    template.description?.trim() || 'Follow a structured path built from proven learning steps.';
  const href = buildRoadmapHref({ id: template.id, title: template.title });
  const category = formatRoadmapTemplateCategory(template.roleCategory);
  const badge = getFeaturedTemplateBadge(template);

  return (
    <Link
      className="group/card border-border/70 bg-background/75 focus-visible:ring-primary/30 hover:border-primary/30 hover:bg-card/85 relative flex min-h-38 flex-col justify-between overflow-hidden rounded-xl border p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-(--shadow-featured-template-card) focus-visible:ring-2 focus-visible:outline-hidden"
      href={href as never}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
        style={{ backgroundImage: 'var(--gradient-featured-template-card)' }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <span className="text-primary border-primary/15 bg-primary/6 max-w-[calc(100%-2.5rem)] truncate rounded-full border px-2.5 py-1 text-[11px] font-semibold">
            {category}
          </span>
          <span className="border-border/70 bg-background/80 text-muted-foreground group-hover/card:text-primary group-hover/card:border-primary/25 group-hover/card:bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5">
            <HugeiconsIcon className="size-3.5" icon={ArrowUpRight01Icon} />
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-foreground line-clamp-2 text-base leading-6 font-semibold">
            {template.title}
          </h4>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-5">{description}</p>
        </div>
      </div>

      <div className="relative z-10 mt-4 flex items-center justify-between gap-3">
        <span className={cn('flex min-w-0 items-center gap-1.5 text-xs', badge.className)}>
          <HugeiconsIcon className="size-3.5 shrink-0" icon={badge.icon} />
          <span className="truncate">{badge.label}</span>
        </span>
        <span className="bg-primary/60 h-px flex-1 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
      </div>
    </Link>
  );
}

function getFeaturedTemplateBadge(template: RoadmapTemplate) {
  const seed = hashTemplateKey(`${template.id}:${template.title}`);

  return (
    FEATURED_TEMPLATE_BADGES[seed % FEATURED_TEMPLATE_BADGES.length] ?? {
      className: 'text-featured-template-choice',
      icon: Award01Icon,
      label: "Developers' Choice",
    }
  );
}

function hashTemplateKey(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function RoadmapFeaturedTemplatesStatus({ message }: { message: string }) {
  return (
    <div className="border-border/70 bg-background/65 flex w-full flex-col items-center gap-4 rounded-2xl border px-4 py-12 text-center shadow-sm backdrop-blur-md">
      <p className="text-muted-foreground text-sm">{message}</p>
      <SeeAllTemplatesLink />
    </div>
  );
}
