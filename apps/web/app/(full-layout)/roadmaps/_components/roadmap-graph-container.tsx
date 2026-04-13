'use client';

import { useMemo, useState } from 'react';

import type { MockRoadmapLayout, MockRoadmapLogic } from '@/lib/data/roadmaps/roadmap-mock.types';
import type {
  NodeStatus,
  RoadmapGraphNode,
  RoadmapNodePanelData,
  RoadmapNodePanelDetail,
  RoadmapTheme,
} from '@/types/roadmap';

import { RoadmapNodePanel } from '@/components/roadmap/roadmap-node-panel';

import { RoadmapGraphCanvas } from './roadmap-graph-canvas';

interface RoadmapGraphContainerProps {
  layout: MockRoadmapLayout;
  logic: MockRoadmapLogic;
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

export function RoadmapGraphContainer({
  layout,
  logic,
  nodePanel,
  theme,
}: RoadmapGraphContainerProps) {
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
      <RoadmapGraphCanvas
        layout={layout}
        activeNodeId={selectedNodeId}
        logic={logic}
        onNodeSelect={(nodeId) => {
          setSelectedNodeId((currentNodeId) => (currentNodeId === nodeId ? null : nodeId));
        }}
        theme={theme}
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
