import {
  AnalyticsUpIcon,
  ArrowUpRight01Icon,
  Award01Icon,
  BookHeartIcon,
  BookUserIcon,
  Calendar03Icon,
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
const SOCIAL_PROOF_LABELS = [
  { className: 'text-rose-500', icon: AnalyticsUpIcon, label: 'Trending now' },
  { className: 'text-amber-500', icon: CalendarFavorite01Icon, label: 'Popular this week' },
  { className: 'text-amber-500', icon: Calendar03Icon, label: 'Popular this month' },
  { className: 'text-violet-500', icon: Award01Icon, label: 'Top pick' },
  { className: 'text-pink-500', icon: BookHeartIcon, label: 'Learner favorite' },
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
      className="text-primary group/see-all focus-visible:ring-primary/30 flex min-h-38 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-violet-500/20 bg-violet-500/[0.03] px-8 text-sm font-medium transition-all duration-200 hover:-translate-y-1 hover:border-violet-500/40 hover:bg-violet-500/10 hover:shadow-[0_18px_42px_rgba(76,29,149,0.12)] focus-visible:ring-2 focus-visible:outline-hidden"
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
  const socialProof = getTemplateSocialProof(template);

  return (
    <Link
      className="group/card border-border/70 bg-background/75 focus-visible:ring-primary/30 relative flex min-h-38 flex-col justify-between overflow-hidden rounded-xl border p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:bg-white/85 hover:shadow-[0_18px_42px_rgba(76,29,149,0.12)] focus-visible:ring-2 focus-visible:outline-hidden"
      href={href as never}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,72,153,0.04) 48%, rgba(14,165,233,0.06))',
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <span className="text-primary max-w-[calc(100%-2.5rem)] truncate rounded-full border border-violet-500/15 bg-violet-500/[0.06] px-2.5 py-1 text-[11px] font-semibold">
            {category}
          </span>
          <span className="border-border/70 bg-background/80 text-muted-foreground group-hover/card:text-primary flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 group-hover/card:translate-x-0.5 group-hover/card:-translate-y-0.5 group-hover/card:border-violet-500/25 group-hover/card:bg-violet-500/10">
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
        <span className={cn('flex min-w-0 items-center gap-1.5 text-xs', socialProof.className)}>
          <HugeiconsIcon className="size-3.5 shrink-0" icon={socialProof.icon} />
          <span className="truncate">{socialProof.label}</span>
        </span>
        <span className="bg-primary/60 h-px flex-1 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
      </div>
    </Link>
  );
}

function getTemplateSocialProof(template: RoadmapTemplate) {
  const seed = hashTemplateKey(`${template.id}:${template.title}`);

  if (seed % 3 === 0) {
    return {
      className: 'text-emerald-500',
      icon: BookUserIcon,
      label: `${(seed % 951) + 50} learners`,
    };
  }

  return (
    SOCIAL_PROOF_LABELS[seed % SOCIAL_PROOF_LABELS.length] ?? {
      className: 'text-rose-500',
      icon: AnalyticsUpIcon,
      label: 'Trending now',
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
