'use client';

import { useMemo, useState } from 'react';

import type { RoadmapLayout } from '@/lib/data/roadmaps/frontend-roadmap.layout';
import type { RoadmapLogic } from '@/lib/data/roadmaps/frontend-roadmap.logic';
import type {
  NodeStatus,
  RoadmapGraphNode,
  RoadmapNodePanelData,
  RoadmapNodePanelDetail,
  RoadmapTheme,
} from '@/types/roadmap';

import { RoadmapNodePanel } from '@/components/roadmap/roadmap-node-panel';

import { RoadmapLogicLayoutGraph } from './roadmap-logic-layout-graph';

interface InteractiveRoadmapGraphProps {
  layout: RoadmapLayout;
  logic: RoadmapLogic;
  nodePanel: RoadmapNodePanelData;
  theme: RoadmapTheme;
}

function buildFallbackPanelDetail(
  label: string,
  relationType: 'required' | 'optional',
  status: NodeStatus,
): RoadmapNodePanelDetail {
  const statusLabel =
    status === 'completed' ? 'completed' : status === 'in_progress' ? 'in progress' : 'pending';

  return {
    description: `${label} is a ${relationType} topic in this roadmap and is currently ${statusLabel}.`,
    resources: {
      emptyLabel: 'No resources yet.',
      sections: [],
    },
    tutor: {
      emptyLabel: 'Your AI tutor suggestions will appear here.',
      sections: [],
    },
  };
}

export function InteractiveRoadmapGraph({
  layout,
  logic,
  nodePanel,
  theme,
}: InteractiveRoadmapGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const graphNodeById = useMemo(() => {
    const mappedNodes = logic.nodes
      .filter((node) => node.kind !== 'title')
      .map((node): RoadmapGraphNode => {
        const relationType = node.relationType ?? 'required';
        const status: NodeStatus = 'locked';

        return {
          id: node.id,
          label: node.label,
          panel:
            nodePanel.detailsByNodeId[node.id] ??
            buildFallbackPanelDetail(node.label, relationType, status),
          parent_node_id: node.parentId,
          relation_type: relationType,
          roadmap_id: logic.roadmapId,
          skill_estimated_hours: null,
          skill_id: node.id,
          skill_name: node.label,
          skills: [],
          sort_order: node.sortOrder,
          status,
          type: 'roadmap_graph_node',
        };
      });

    return new Map(mappedNodes.map((node) => [node.id, node]));
  }, [logic.nodes, logic.roadmapId, nodePanel.detailsByNodeId]);

  const selectedNode = selectedNodeId ? (graphNodeById.get(selectedNodeId) ?? null) : null;

  return (
    <>
      <RoadmapLogicLayoutGraph
        layout={layout}
        activeNodeId={selectedNodeId}
        logic={logic}
        onNodeSelect={(nodeId) => {
          setSelectedNodeId((currentNodeId) => (currentNodeId === nodeId ? null : nodeId));
        }}
      />

      {selectedNode ? (
        <RoadmapNodePanel
          aiTutorTabLabel={nodePanel.aiTutorTabLabel}
          node={selectedNode}
          resourcesTabLabel={nodePanel.resourcesTabLabel}
          statusLabels={nodePanel.statusLabels}
          theme={theme}
          onClose={() => setSelectedNodeId(null)}
        />
      ) : null}
    </>
  );
}
