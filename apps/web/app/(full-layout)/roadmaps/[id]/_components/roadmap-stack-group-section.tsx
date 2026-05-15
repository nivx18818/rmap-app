'use client';

import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import { Separator } from '@repo/design-system/components/ui/separator';
import { cn } from '@repo/design-system/lib/utils';

import { HighlightedText } from '@/components/shared/highlighted-text';

import type { RoadmapStackSection } from '../_types/roadmap-stack-section.types';

import { sectionClasses } from '../_constants/roadmap-stack-list.constants';
import { getGroupStatusIcon, getGroupStatusIconClasses } from '../_utils/roadmap-stack-icon.utils';
import { getSectionDisplayStatus } from '../_utils/roadmap-stack-list.utils';
import { RoadmapStackChildList } from './roadmap-stack-child-list';
import { RoadmapStackSectionBadges } from './roadmap-stack-section-badges';

interface RoadmapStackGroupSectionProps {
  canOpenSection: boolean;
  isOpen: boolean;
  onToggle: () => void;
  searchQuery?: string;
  section: RoadmapStackSection;
}

export function RoadmapStackGroupSection({
  canOpenSection,
  isOpen,
  onToggle,
  searchQuery,
  section,
}: RoadmapStackGroupSectionProps) {
  const sectionStatus = getSectionDisplayStatus(section);
  const groupStatusIcon = getGroupStatusIcon(sectionStatus, section.children);
  const groupStatusIconClasses = getGroupStatusIconClasses(sectionStatus);

  return (
    <section className={cn('rounded-lg border', sectionClasses.group)}>
      <Button
        variant="ghost"
        className="h-auto w-full justify-between rounded-lg px-4 py-4 text-left [&_svg]:size-5!"
        type="button"
        aria-expanded={isOpen}
        aria-disabled={!canOpenSection}
        onClick={() => {
          if (!canOpenSection) return;

          onToggle();
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full',
              groupStatusIconClasses,
            )}
          >
            <HugeiconsIcon icon={groupStatusIcon} />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-foreground text-sm font-semibold whitespace-normal">
                <HighlightedText query={searchQuery} text={section.title} />
              </span>
              <RoadmapStackSectionBadges
                lessons={section.children.length}
                sectionStatus={sectionStatus}
              />
            </div>
          </div>
        </div>
        <HugeiconsIcon
          className={cn(
            'transition-transform',
            isOpen && 'rotate-180',
            !canOpenSection && 'text-muted-foreground/50',
          )}
          data-icon="inline-end"
          icon={ArrowDown01Icon}
        />
      </Button>

      {isOpen ? (
        <>
          <Separator />
          <div className="p-3">
            <RoadmapStackChildList nodes={section.children} searchQuery={searchQuery} />
          </div>
        </>
      ) : null}
    </section>
  );
}
