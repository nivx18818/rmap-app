import { cn } from '@repo/design-system/lib/utils';

import type { RoadmapNode, SkillNode } from '@/types/roadmap';

import type { Side } from './roadmap-graph-layout';

export function SkillPill({
  className,
  minWidth,
  side,
  skill,
  size = 'small',
}: {
  className?: string;
  minWidth?: number;
  side: Side;
  skill: SkillNode;
  size?: 'large' | 'small';
}) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-[22px] border-[3px] border-[#111827] bg-[#f7b1a8] text-center font-medium text-[#43394e] shadow-[0_5px_0_rgba(17,24,39,0.08)]',
        size === 'large'
          ? 'min-h-[72px] px-7 py-4 text-[18px] leading-[1.25]'
          : 'min-h-[52px] px-4 py-2 text-[12px] leading-[1.2] shadow-none',
        className,
      )}
      style={minWidth ? { minWidth: `${minWidth}px` } : undefined}
    >
      <span
        className={cn(
          'absolute top-1/2 size-4 -translate-y-1/2 rounded-full border-[3px] border-[#8b5cf6] bg-white',
          side === 'left' ? '-left-2' : '-right-2',
        )}
      />
      {skill.label}
    </div>
  );
}

export function MainNode({ className, node }: { className?: string; node: RoadmapNode }) {
  return (
    <div
      className={cn(
        'flex h-[58px] w-[300px] items-center justify-center rounded-[8px] border-[3px] border-[#111827] bg-[#9fd6f4] px-5 text-[18px] leading-none font-medium text-[#17344e]',
        className,
      )}
    >
      {node.label}
    </div>
  );
}
