'use client';

import type { NodeProps } from '@xyflow/react';

import { Award01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@repo/design-system/lib/utils';
import { Handle, Position } from '@xyflow/react';

import { MarqueeText } from '@/components/shared/marquee-text';

import type { RoadmapFlowNode } from '../_types/roadmap-flow.types';
import type { NodeType, ProgressStatus } from '../_types/roadmap-node.types';

import {
  ROADMAP_FLOW_NODE_SIZES,
  groupStatusClasses,
  milestoneMarkerClasses,
  milestoneStatusClasses,
  nodeNameStatusClasses,
  skillMarkerClasses,
  skillTypeStatusClasses,
} from '../_constants/roadmap-flow.constants';

function FlowHandles() {
  return (
    <>
      <Handle id="top" className="opacity-0" type="target" position={Position.Top} />
      <Handle id="bottom" className="opacity-0" type="source" position={Position.Bottom} />
      <Handle id="left-source" className="opacity-0" type="source" position={Position.Left} />
      <Handle id="left-target" className="opacity-0" type="target" position={Position.Left} />
      <Handle id="right-source" className="opacity-0" type="source" position={Position.Right} />
      <Handle id="right-target" className="opacity-0" type="target" position={Position.Right} />
    </>
  );
}

function SkillCheckMarker({
  nodeType,
  side,
}: {
  nodeType: Extract<NodeType, 'OPTIONAL' | 'REQUIRED'>;
  side: 'left' | 'right';
}) {
  return (
    <span
      className={cn(
        'absolute top-1/2 z-10 flex size-4.5 -translate-y-1/2 items-center justify-center drop-shadow-[0_1px_2px_rgba(17,24,39,0.22)]',
        skillMarkerClasses[nodeType],
        side === 'left' ? '-left-2.5' : '-right-2.5',
      )}
      aria-hidden="true"
    >
      <svg className="size-full" fill="none" aria-hidden="true" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          clipRule="evenodd"
          d="M1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25C6.06294 1.25 1.25 6.06294 1.25 12Z"
          fillRule="evenodd"
        />
        <path
          fill="#ffffff"
          clipRule="evenodd"
          d="M16.6757 8.26285C17.0828 8.63604 17.1103 9.26861 16.7372 9.67573L11.2372 15.6757C11.0528 15.8768 10.7944 15.9938 10.5217 15.9998C10.249 16.0057 9.98576 15.9 9.79289 15.7071L7.29289 13.2071C6.90237 12.8166 6.90237 12.1834 7.29289 11.7929C7.68342 11.4024 8.31658 11.4024 8.70711 11.7929L10.4686 13.5544L15.2628 8.32428C15.636 7.91716 16.2686 7.88966 16.6757 8.26285Z"
          fillRule="evenodd"
        />
      </svg>
    </span>
  );
}

function MilestoneMarker({ status }: { status: ProgressStatus }) {
  return (
    <span
      className={cn(
        'absolute top-1/2 -right-3 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full shadow-[0_1px_2px_rgba(17,24,39,0.22)]',
        milestoneMarkerClasses[status],
      )}
      aria-hidden="true"
    >
      <HugeiconsIcon className="size-3.5" icon={Award01Icon} />
    </span>
  );
}

function RoadmapStateNode({
  data,
  selected,
  variant,
}: NodeProps<RoadmapFlowNode> & {
  variant: 'group' | 'skill' | 'milestone';
}) {
  const node = data.node;
  if (!node) return null;

  const status = data.visualStatus ?? node.progress?.status ?? 'LOCKED';
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
        'relative flex items-center justify-center overflow-visible rounded-[6px] border-2 px-3 py-0 transition-colors',
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
      {variant === 'skill' ? <SkillCheckMarker nodeType={skillType} side={markerSide} /> : null}
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
