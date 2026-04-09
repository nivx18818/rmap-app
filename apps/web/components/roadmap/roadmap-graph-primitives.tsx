import { cn } from '@repo/design-system/lib/utils';

import type { RelationType, RoadmapNode, SkillNode } from '@/types/roadmap';

import type { Side } from './roadmap-graph-layout';

import { RoadmapLinkIcon } from './roadmap-icons';

export function SkillPill({
  anchorRef,
  className,
  minWidth,
  relationType = 'required',
  side,
  skill,
  size = 'small',
}: {
  anchorRef?: React.Ref<HTMLSpanElement>;
  className?: string;
  minWidth?: number;
  relationType?: RelationType;
  side: Side;
  skill: SkillNode;
  size?: 'large' | 'small';
}) {
  const linkToneByRelationType = {
    optional: 'green',
    required: 'purple',
  } as const;
  const linkTone = linkToneByRelationType[relationType];

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-[22px] border-[3px] border-[#111827] bg-[#f7b1a8] text-center font-sans font-medium tracking-[-0.02em] text-[#43394e] shadow-[0_5px_0_rgba(17,24,39,0.08)]',
        size === 'large'
          ? 'min-h-[72px] px-7 py-4 text-[18px] leading-[1.25]'
          : 'min-h-[52px] px-4 py-2 text-[12px] leading-[1.2] shadow-none',
        className,
      )}
      style={minWidth ? { minWidth: `${minWidth}px` } : undefined}
    >
      <span
        ref={anchorRef}
        className={cn(
          'absolute top-1/2 z-20 -translate-y-1/2',
          side === 'left' ? '-left-[8.5px]' : '-right-[8.5px]',
        )}
      >
        <RoadmapLinkIcon tone={linkTone} />
      </span>
      {skill.label}
    </div>
  );
}

export function MainNode({ className, node }: { className?: string; node: RoadmapNode }) {
  return (
    <div
      className={cn(
        'font-graph-node flex h-[58px] w-[300px] items-center justify-center rounded-[8px] border-[3px] border-[#111827] bg-[#9fd6f4] px-5 text-center text-[15.001px] leading-normal font-normal text-black',
        className,
      )}
    >
      {node.label}
    </div>
  );
}
