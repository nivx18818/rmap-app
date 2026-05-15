'use client';

import type { Edge, OnEdgesChange, OnNodesChange } from '@xyflow/react';

import { ReactFlow } from '@xyflow/react';

import type { RoadmapFlowNode, RoadmapNodeTypes } from '../_types/roadmap-flow.types';

import {
  RoadmapGroupNode,
  RoadmapMilestoneNode,
  RoadmapSkillNode,
  RoadmapTitleNode,
} from './roadmap-flow-node';

const nodeTypes = {
  milestone: RoadmapMilestoneNode,
  roadmapGroup: RoadmapGroupNode,
  roadmapTitle: RoadmapTitleNode,
  skill: RoadmapSkillNode,
} satisfies RoadmapNodeTypes;

interface RoadmapSkillTreeProps {
  desktopFlowLayout: {
    height: number;
    width: number;
  };
  edgeChanges: OnEdgesChange<Edge>;
  edges: Edge[];
  nodeChanges: OnNodesChange<RoadmapFlowNode>;
  nodes: RoadmapFlowNode[];
  treeKey: string;
}

export function RoadmapSkillTree({
  desktopFlowLayout,
  edgeChanges,
  edges,
  nodeChanges,
  nodes,
  treeKey,
}: RoadmapSkillTreeProps) {
  return (
    <div
      className="mx-auto w-full overflow-hidden"
      style={{
        aspectRatio:
          desktopFlowLayout.width && desktopFlowLayout.height
            ? `${desktopFlowLayout.width} / ${desktopFlowLayout.height}`
            : 'auto',
        maxWidth: desktopFlowLayout.width ? `${desktopFlowLayout.width}px` : '100%',
      }}
    >
      <ReactFlow
        key={treeKey}
        minZoom={0.05}
        colorMode="light"
        edges={edges}
        elementsSelectable={false}
        fitView
        fitViewOptions={{ padding: 0.05 }}
        nodes={nodes}
        nodesConnectable={false}
        nodesDraggable={false}
        nodeTypes={nodeTypes}
        onEdgesChange={edgeChanges}
        onNodesChange={nodeChanges}
        panOnDrag={false}
        panOnScroll={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
        zoomOnDoubleClick={false}
        zoomOnPinch={false}
        zoomOnScroll={false}
      />
    </div>
  );
}
