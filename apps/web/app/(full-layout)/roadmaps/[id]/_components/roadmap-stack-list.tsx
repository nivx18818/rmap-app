'use client';

import {
  ArrowDown01Icon,
  CircleLock01Icon,
  MedalFirstPlaceIcon,
  MedalSecondPlaceIcon,
  MedalThirdPlaceIcon,
  Progress01Icon,
  Progress02Icon,
  Progress03Icon,
  Progress04Icon,
  Tick04Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { Separator } from '@repo/design-system/components/ui/separator';
import { cn } from '@repo/design-system/lib/utils';
import { useMemo, useState } from 'react';

import { HighlightedText } from '@/components/shared/highlighted-text';

import type { NodeType, ProgressStatus, RoadmapNode } from '../_types/roadmap-node.types';
import type { RoadmapStackSection } from '../_types/roadmap-stack-section.types';

import {
  mileStoneIconClasses,
  milestoneTypeBadgeClasses,
  sectionClasses,
  statusBadgeClasses,
} from '../_constants/roadmap-stack-list.constants';
import { NODE_TYPE_LABELS, STATUS_LABELS } from '../_types/roadmap-flow.types';
import {
  buildStackSections,
  getNodeStatus,
  getSectionDisplayStatus,
} from '../_utils/roadmap-stack-list.utils';

interface RoadmapStackListProps {
  baseNodes?: RoadmapNode[];
  isFiltered?: boolean;
  nodes: RoadmapNode[];
  nodeType?: NodeType | null;
  searchQuery?: string;
  status?: ProgressStatus | null;
}

function renderSectionBadges({
  lessons,
  sectionStatus,
}: {
  lessons: number;
  sectionStatus: ProgressStatus;
}) {
  return (
    <>
      {lessons > 0 ? <Badge variant="outline">{lessons} lessons</Badge> : null}
      <Badge variant="outline" className={statusBadgeClasses[sectionStatus]}>
        {STATUS_LABELS[sectionStatus]}
      </Badge>
    </>
  );
}

function getInProgressIconByChildCount(childCount: number) {
  const progressStep = Math.max(1, Math.min(4, childCount));

  if (progressStep === 1) return Progress01Icon;
  if (progressStep === 2) return Progress02Icon;
  if (progressStep === 3) return Progress03Icon;

  return Progress04Icon;
}

function getMilestoneMedalIcon(milestoneIndex: number) {
  if (milestoneIndex === 0) return MedalFirstPlaceIcon;
  if (milestoneIndex === 1) return MedalSecondPlaceIcon;
  return MedalThirdPlaceIcon;
}

export function RoadmapStackList({
  baseNodes,
  isFiltered = false,
  nodes,
  nodeType,
  searchQuery,
  status,
}: RoadmapStackListProps) {
  const sections = useMemo(
    () => buildStackSections(nodes, { baseNodes, isFiltered }),
    [baseNodes, isFiltered, nodes],
  );
  const milestoneOrderById = useMemo(() => {
    const milestoneIds = sections
      .filter((section) => section.type === 'milestone')
      .map((section) => section.id);

    return new Map(milestoneIds.map((id, index) => [id, index]));
  }, [sections]);
  const isLeafFilter = nodeType === 'REQUIRED' || nodeType === 'OPTIONAL';
  const shouldWrapOrphanList = isLeafFilter || (nodeType == null && status != null);
  const [openSectionIds, setOpenSectionIds] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setOpenSectionIds((currentSectionIds) => {
      const nextSectionIds = new Set(currentSectionIds);

      if (nextSectionIds.has(sectionId)) nextSectionIds.delete(sectionId);
      else nextSectionIds.add(sectionId);

      return nextSectionIds;
    });
  };

  const renderChildNode = (childNode: RoadmapNode) => {
    const childStatus = getNodeStatus(childNode);

    return (
      <div
        key={childNode.id}
        className="border-border/80 bg-background hover:bg-muted/40 hover:border-primary/40 flex cursor-pointer flex-col gap-2 rounded-md border px-3 py-3 shadow-sm transition-colors sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-foreground text-sm font-medium">
            <HighlightedText query={searchQuery} text={childNode.name} />
          </span>
          {childNode.estimatedHours ? (
            <span className="text-muted-foreground text-xs">{childNode.estimatedHours} hours</span>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Badge variant="secondary">{NODE_TYPE_LABELS[childNode.nodeType]}</Badge>
          <Badge variant="outline" className={statusBadgeClasses[childStatus]}>
            {STATUS_LABELS[childStatus]}
          </Badge>
        </div>
      </div>
    );
  };

  const renderChildNodes = (childNodes: RoadmapNode[]) => (
    <div className="flex flex-col gap-2">
      {childNodes.length > 0 ? (
        childNodes.map(renderChildNode)
      ) : (
        <p className="text-muted-foreground px-1 py-3 text-sm">
          No visible required or optional skills in this section.
        </p>
      )}
    </div>
  );

  const renderMilestoneSection = (section: RoadmapStackSection) => {
    const sectionStatus = getSectionDisplayStatus(section);
    const milestoneIndex = milestoneOrderById.get(section.id) ?? 0;
    const milestoneIcon = getMilestoneMedalIcon(milestoneIndex);

    return (
      <section
        key={section.id}
        className={cn('rounded-lg border px-4 py-4', sectionClasses.milestone[sectionStatus])}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full shadow-sm',
              mileStoneIconClasses[sectionStatus],
            )}
          >
            <HugeiconsIcon size={22} icon={milestoneIcon} />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-foreground text-sm font-semibold whitespace-normal">
              <HighlightedText query={searchQuery} text={section.title} />
            </span>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Badge variant="secondary" className={milestoneTypeBadgeClasses[sectionStatus]}>
                Milestone
              </Badge>
              <Badge variant="outline" className={statusBadgeClasses[sectionStatus]}>
                {STATUS_LABELS[sectionStatus]}
              </Badge>
            </div>
          </div>
        </div>
        {section.children.length > 0 ? (
          <>
            <Separator className="my-3" />
            {renderChildNodes(section.children)}
          </>
        ) : isFiltered ? (
          <p className="text-muted-foreground px-1 pt-3 text-sm">
            No matched lessons in this section.
          </p>
        ) : null}
      </section>
    );
  };

  const renderGroupSection = (
    section: RoadmapStackSection,
    isOpen: boolean,
    canOpenSection: boolean,
  ) => {
    const sectionStatus = getSectionDisplayStatus(section);
    const groupStatusIcon =
      sectionStatus === 'LOCKED'
        ? CircleLock01Icon
        : sectionStatus === 'COMPLETED'
          ? Tick04Icon
          : getInProgressIconByChildCount(section.children.length);
    const groupStatusIconClasses =
      sectionStatus === 'LOCKED'
        ? 'bg-zinc-200 text-foreground'
        : sectionStatus === 'COMPLETED'
          ? 'bg-emerald-100 text-emerald-600'
          : 'bg-primary/10 text-primary';

    return (
      <section key={section.id} className={cn('rounded-lg border', sectionClasses.group)}>
        <Button
          variant="ghost"
          className="h-auto w-full justify-between rounded-lg px-4 py-4 text-left [&_svg]:size-5!"
          type="button"
          aria-expanded={isOpen}
          aria-disabled={!canOpenSection}
          onClick={() => {
            if (!canOpenSection) return;

            toggleSection(section.id);
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
                {renderSectionBadges({
                  lessons: section.children.length,
                  sectionStatus,
                })}
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
            <div className="p-3">{renderChildNodes(section.children)}</div>
          </>
        ) : null}
      </section>
    );
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {sections.map((section) => {
        if (section.type === 'orphan' && !section.node) {
          return (
            <div
              key={section.id}
              className={cn(
                'flex flex-col gap-2 p-3',
                shouldWrapOrphanList
                  ? 'border-border bg-background rounded-lg border shadow-sm'
                  : '',
              )}
            >
              {isFiltered ? (
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-foreground text-sm font-semibold">{section.title}</h3>
                  <Badge variant="secondary">{section.children.length} matched</Badge>
                </div>
              ) : null}
              {renderChildNodes(section.children)}
            </div>
          );
        }

        if (section.type === 'milestone') {
          return renderMilestoneSection(section);
        }

        if (section.type === 'group') {
          const canOpenSection = !isFiltered || section.children.length > 0;
          const isOpen = canOpenSection && (isFiltered || openSectionIds.has(section.id));

          return renderGroupSection(section, isOpen, canOpenSection);
        }

        return null;
      })}
    </div>
  );
}
