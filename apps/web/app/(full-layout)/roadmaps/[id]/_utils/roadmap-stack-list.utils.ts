import type { ProgressStatus, RoadmapNode } from '../_types/roadmap-node.types';
import type { RoadmapStackSection } from '../_types/roadmap-stack-section.types';

import { getNodeStatus, isAxisNode, isSkillNode, sortRoadmapNodes } from './roadmap-node.utils';

export function getSectionStatus(children: RoadmapNode[]): ProgressStatus {
  if (children.length === 0) return 'LOCKED';

  const statuses = children.map(getNodeStatus);
  if (statuses.every((status) => status === 'COMPLETED')) return 'COMPLETED';
  if (statuses.every((status) => status === 'LOCKED')) return 'LOCKED';

  return 'IN_PROGRESS';
}

export function getSectionDisplayStatus(section: RoadmapStackSection): ProgressStatus {
  if (section.node) {
    return getNodeStatus(section.node);
  }

  return getSectionStatus(section.children);
}

interface BuildStackSectionsOptions {
  baseNodes?: RoadmapNode[];
  isFiltered?: boolean;
}

export function buildStackSections(
  nodes: RoadmapNode[],
  options: BuildStackSectionsOptions = {},
): RoadmapStackSection[] {
  const baseNodeById = new Map((options.baseNodes ?? []).map((node) => [node.id, node]));
  const nodesByParentId = nodes.reduce<Map<string, RoadmapNode[]>>((childMap, node) => {
    if (!node.parentId) return childMap;

    const childNodes = childMap.get(node.parentId) ?? [];
    childNodes.push(node);
    childMap.set(node.parentId, childNodes);

    return childMap;
  }, new Map());

  const groupedChildIds = new Set<string>();
  const sections = nodes
    .filter((node) => !node.parentId && isAxisNode(node))
    .sort(sortRoadmapNodes)
    .map<RoadmapStackSection>((node) => {
      const children = (nodesByParentId.get(node.id) ?? [])
        .filter(isSkillNode)
        .sort(sortRoadmapNodes);

      for (const child of children) {
        groupedChildIds.add(child.id);
      }

      return {
        children,
        id: node.id,
        node,
        title: node.name,
        type: node.nodeType === 'MILESTONE' ? 'milestone' : 'group',
      };
    });

  const orphanSkills = nodes
    .filter((node) => isSkillNode(node) && !groupedChildIds.has(node.id))
    .sort(sortRoadmapNodes);

  if (orphanSkills.length > 0 && options.isFiltered && baseNodeById.size > 0) {
    const orphanSkillsByParentId = orphanSkills.reduce<Map<string, RoadmapNode[]>>(
      (sectionMap, skillNode) => {
        const parentId = skillNode.parentId;

        if (!parentId) return sectionMap;

        const parentNode = baseNodeById.get(parentId);
        if (!parentNode || !isAxisNode(parentNode)) {
          return sectionMap;
        }

        const childNodes = sectionMap.get(parentId) ?? [];
        childNodes.push(skillNode);
        sectionMap.set(parentId, childNodes);

        return sectionMap;
      },
      new Map(),
    );

    const groupedOrphanSkillIds = new Set<string>();
    const parentSections: RoadmapStackSection[] = [];

    for (const [parentId, children] of orphanSkillsByParentId.entries()) {
      const parentNode = baseNodeById.get(parentId);

      if (!parentNode) continue;

      for (const child of children) {
        groupedOrphanSkillIds.add(child.id);
      }

      parentSections.push({
        children: children.sort(sortRoadmapNodes),
        id: `matched-parent-${parentId}`,
        node: parentNode,
        title: parentNode.name,
        type: parentNode.nodeType === 'MILESTONE' ? 'milestone' : 'group',
      });
    }

    parentSections.sort((left, right) => {
      const leftNode = left.node;
      const rightNode = right.node;

      if (!leftNode || !rightNode) return left.title.localeCompare(right.title);

      return sortRoadmapNodes(leftNode, rightNode);
    });

    sections.push(...parentSections);

    const ungroupedOrphanSkills = orphanSkills.filter(
      (node) => !groupedOrphanSkillIds.has(node.id),
    );

    if (ungroupedOrphanSkills.length > 0) {
      sections.push({
        children: ungroupedOrphanSkills,
        id: 'other-matched-skills',
        node: null,
        title: 'Other matched skills',
        type: 'orphan',
      });
    }
  } else if (orphanSkills.length > 0) {
    sections.push({
      children: orphanSkills,
      id: options.isFiltered ? 'matched-skills' : 'visible-skills',
      node: null,
      title: options.isFiltered ? 'Matched skills' : 'Visible Skills',
      type: 'orphan',
    });
  }

  return sections;
}
