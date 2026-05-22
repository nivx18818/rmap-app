'use client';

import type { RoadmapNode } from '../_types/roadmap-node.types';

import { RoadmapStackChildNode } from './roadmap-stack-child-node';

interface RoadmapStackChildListProps {
  nodes: RoadmapNode[];
  onNodeSelect?: (nodeId: string) => void;
  searchQuery?: string;
}

export function RoadmapStackChildList({
  nodes,
  onNodeSelect,
  searchQuery,
}: RoadmapStackChildListProps) {
  return (
    <div className="flex flex-col gap-2">
      {nodes.length > 0 ? (
        nodes.map((node) => (
          <RoadmapStackChildNode
            key={node.id}
            node={node}
            searchQuery={searchQuery}
            onNodeSelect={onNodeSelect}
          />
        ))
      ) : (
        <p className="text-muted-foreground px-1 py-3 text-sm">
          No visible required or optional skills in this section.
        </p>
      )}
    </div>
  );
}
