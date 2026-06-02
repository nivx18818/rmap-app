import type { RoadmapNode, RoadmapNodesFilter } from '../_types/roadmap-node.types';
import type { NodeType, ProgressStatus } from '../_types/roadmap-node.types';

import {
  NODE_TYPE_BY_URL_VALUE,
  NODE_TYPE_URL_VALUES,
  STATUS_BY_URL_VALUE,
  STATUS_URL_VALUES,
} from '../_constants/roadmap-node.constants';
import { isAxisNodeType } from './roadmap-node.utils';

export function parseNodeTypeFromUrl(value: string | null): NodeType | null {
  if (!value) return null;

  if (value in NODE_TYPE_BY_URL_VALUE) {
    return NODE_TYPE_BY_URL_VALUE[value as keyof typeof NODE_TYPE_BY_URL_VALUE];
  }

  return null;
}

export function parseStatusFromUrl(value: string | null): ProgressStatus | null {
  if (!value) return null;

  if (value in STATUS_BY_URL_VALUE) {
    return STATUS_BY_URL_VALUE[value as keyof typeof STATUS_BY_URL_VALUE];
  }

  return null;
}

export function getNodeTypeUrlValue(nodeType: NodeType): string {
  return NODE_TYPE_URL_VALUES[nodeType];
}

export function getStatusUrlValue(status: ProgressStatus): string {
  return STATUS_URL_VALUES[status];
}

export function isAxisFilter(nodeType: NodeType | null): boolean {
  return nodeType ? isAxisNodeType(nodeType) : false;
}

export function buildRoadmapNodesFilter({
  nodeType,
  searchQuery,
  status,
}: {
  nodeType: NodeType | null;
  searchQuery: string;
  status: ProgressStatus | null;
}): RoadmapNodesFilter {
  return {
    nodeType: nodeType ?? undefined,
    q: searchQuery.trim() || undefined,
    status: status ?? undefined,
  };
}

export function filterRoadmapNodes(
  nodes: RoadmapNode[],
  {
    nodeType,
    searchQuery,
    status,
  }: {
    nodeType: NodeType | null;
    searchQuery: string;
    status: ProgressStatus | null;
  },
): RoadmapNode[] {
  const trimmedQuery = searchQuery.trim().toLowerCase();

  return nodes.filter((node) => {
    if (nodeType && node.nodeType !== nodeType) return false;
    if (status && node.progress?.status !== status) return false;
    if (trimmedQuery && !node.name.toLowerCase().includes(trimmedQuery)) return false;

    return true;
  });
}
