'use client';

import { Badge } from '@repo/design-system/components/ui/badge';

import { HighlightedText } from '@/components/shared/highlighted-text';

import type { RoadmapNode } from '../_types/roadmap-node.types';

import { NODE_TYPE_LABELS, STATUS_LABELS } from '../_constants/roadmap-node.constants';
import { statusBadgeClasses } from '../_constants/roadmap-stack-list.constants';
import { getNodeStatus } from '../_utils/roadmap-node.utils';

interface RoadmapStackChildNodeProps {
  node: RoadmapNode;
  onNodeSelect?: (nodeId: string) => void;
  searchQuery?: string;
}

export function RoadmapStackChildNode({
  node,
  onNodeSelect,
  searchQuery,
}: RoadmapStackChildNodeProps) {
  const childStatus = getNodeStatus(node);

  return (
    <button
      className="border-border/80 bg-background hover:bg-muted/40 hover:border-primary/40 focus-visible:border-ring focus-visible:ring-ring/50 flex cursor-pointer flex-col gap-2 rounded-md border px-3 py-3 text-left shadow-sm transition-colors outline-none focus-visible:ring-3 sm:flex-row sm:items-center sm:justify-between"
      type="button"
      onClick={() => onNodeSelect?.(node.id)}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-foreground text-sm font-medium">
          <HighlightedText query={searchQuery} text={node.name} />
        </span>
        {node.estimatedHours ? (
          <span className="text-muted-foreground text-xs">{node.estimatedHours} hours</span>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Badge variant="secondary">{NODE_TYPE_LABELS[node.nodeType]}</Badge>
        <Badge variant="outline" className={statusBadgeClasses[childStatus]}>
          {STATUS_LABELS[childStatus]}
        </Badge>
      </div>
    </button>
  );
}
