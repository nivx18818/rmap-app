'use client';

import { useMemo, useState } from 'react';

import type { NodeType, ProgressStatus, RoadmapNode } from '../_types/roadmap-node.types';

import { isSkillNodeType } from '../_utils/roadmap-node.utils';
import { buildStackSections } from '../_utils/roadmap-stack-list.utils';
import { RoadmapStackGroupSection } from './roadmap-stack-group-section';
import { RoadmapStackMilestoneSection } from './roadmap-stack-milestone-section';
import { RoadmapStackOrphanSection } from './roadmap-stack-orphan-section';

interface RoadmapStackListProps {
  baseNodes?: RoadmapNode[];
  isFiltered?: boolean;
  nodes: RoadmapNode[];
  nodeType?: NodeType | null;
  onNodeSelect?: (nodeId: string) => void;
  searchQuery?: string;
  status?: ProgressStatus | null;
}

export function RoadmapStackList({
  baseNodes,
  isFiltered = false,
  nodes,
  nodeType,
  onNodeSelect,
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
  const isLeafFilter = nodeType ? isSkillNodeType(nodeType) : false;
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

  return (
    <div className="flex w-full flex-col gap-3">
      {sections.map((section) => {
        if (section.type === 'orphan' && !section.node) {
          return (
            <RoadmapStackOrphanSection
              key={section.id}
              isFiltered={isFiltered}
              onNodeSelect={onNodeSelect}
              searchQuery={searchQuery}
              section={section}
              shouldWrapOrphanList={shouldWrapOrphanList}
            />
          );
        }

        if (section.type === 'milestone') {
          return (
            <RoadmapStackMilestoneSection
              key={section.id}
              isFiltered={isFiltered}
              milestoneIndex={milestoneOrderById.get(section.id) ?? 0}
              onNodeSelect={onNodeSelect}
              searchQuery={searchQuery}
              section={section}
            />
          );
        }

        if (section.type === 'group') {
          const canOpenSection = !isFiltered || section.children.length > 0;
          const isOpen = canOpenSection && (isFiltered || openSectionIds.has(section.id));

          return (
            <RoadmapStackGroupSection
              key={section.id}
              canOpenSection={canOpenSection}
              isOpen={isOpen}
              onNodeSelect={onNodeSelect}
              searchQuery={searchQuery}
              section={section}
              onToggle={() => toggleSection(section.id)}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
