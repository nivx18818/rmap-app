'use client';

import type { NodeProps } from '@xyflow/react';

import { cn } from '@repo/design-system/lib/utils';

import { MarqueeText } from '@/components/shared/marquee-text';

import type { RoadmapFlowNode } from '../_types/roadmap-flow.types';
import type { NodeType } from '../_types/roadmap-node.types';

import {
  ROADMAP_FLOW_NODE_SIZES,
  groupStatusClasses,
  milestoneStatusClasses,
  nodeNameStatusClasses,
  skillTypeStatusClasses,
} from '../_constants/roadmap-flow.constants';
import { getNodeStatus } from '../_utils/roadmap-node.utils';
import { FlowHandles } from './roadmap-flow-handles';
import { MilestoneMarker, SkillCheckMarker } from './roadmap-flow-markers';

function RoadmapStateNode({
  data,
  selected,
  variant,
}: NodeProps<RoadmapFlowNode> & {
  variant: 'group' | 'skill' | 'milestone';
}) {
  const node = data.node;
  if (!node) return null;

  const status = data.visualStatus ?? getNodeStatus(node);
  const matchState = data.matchState ?? 'normal';
  const markerSide = data.markerSide ?? 'right';
  const skillType: Extract<NodeType, 'OPTIONAL' | 'REQUIRED'> =
    node.nodeType === 'OPTIONAL' ? 'OPTIONAL' : 'REQUIRED';

  const containerClasses =
    variant === 'group'
      ? groupStatusClasses[status]
      : variant === 'milestone'
        ? milestoneStatusClasses[status]
        : skillTypeStatusClasses[skillType][status];

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-visible rounded-md border-2 px-3 py-0 transition-colors',
        containerClasses,
        matchState === 'dimmed' && 'opacity-35 grayscale-[0.35]',
        selected && 'ring-ring ring-2',
      )}
      style={{
        height: ROADMAP_FLOW_NODE_SIZES.node.height,
        width: ROADMAP_FLOW_NODE_SIZES.node.width,
      }}
    >
      <FlowHandles />
      {variant === 'skill' ? <SkillCheckMarker nodeType={skillType} position={markerSide} /> : null}
      {variant === 'milestone' ? <MilestoneMarker status={status} /> : null}
      <div className="flex max-w-full min-w-0 flex-1 items-center justify-center">
        <MarqueeText
          className="text-[15px] leading-none font-normal text-current"
          highlightQuery={data.searchQuery}
          text={node.name}
          textClassName={
            !(variant === 'milestone' && status === 'IN_PROGRESS')
              ? nodeNameStatusClasses[status]
              : undefined
          }
        />
      </div>
    </div>
  );
}

export function RoadmapGroupNode(props: NodeProps<RoadmapFlowNode>) {
  return <RoadmapStateNode {...props} variant="group" />;
}

export function RoadmapSkillNode(props: NodeProps<RoadmapFlowNode>) {
  return <RoadmapStateNode {...props} variant="skill" />;
}

export function RoadmapMilestoneNode(props: NodeProps<RoadmapFlowNode>) {
  return <RoadmapStateNode {...props} variant="milestone" />;
}

export function RoadmapTitleNode({ data, selected }: NodeProps<RoadmapFlowNode>) {
  const title = data.title ?? 'Roadmap';

  return (
    <div
      className={cn(
        'relative flex items-center justify-center bg-transparent px-0 py-0 text-center',
        selected && 'ring-ring ring-2',
      )}
      style={{
        height: ROADMAP_FLOW_NODE_SIZES.title.height,
        width: ROADMAP_FLOW_NODE_SIZES.title.width,
      }}
    >
      <FlowHandles />
      <MarqueeText
        className="font-heading text-foreground text-[32px] leading-none font-semibold"
        text={title}
      />
    </div>
  );
}
