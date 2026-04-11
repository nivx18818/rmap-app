import { cn } from '@repo/design-system/lib/utils';

import type {
  RelationType,
  RoadmapGraphNode,
  RoadmapGraphSkill,
  RoadmapTheme,
} from '@/types/roadmap';

import { RoadmapLinkIcon } from './roadmap-icons';

type Side = 'left' | 'right';

export function SkillPill({
  anchorRef,
  className,
  maxWidth,
  minWidth,
  onClick,
  relationType = 'required',
  side,
  skill,
  size = 'small',
  theme,
}: {
  anchorRef?: React.Ref<HTMLSpanElement>;
  className?: string;
  maxWidth?: string;
  minWidth?: number | string;
  onClick?: () => void;
  relationType?: RelationType;
  side: Side;
  skill: RoadmapGraphSkill;
  size?: 'large' | 'small';
  theme: RoadmapTheme;
}) {
  const linkToneByRelationType = {
    optional: 'green',
    required: 'purple',
  } as const;
  const linkTone = linkToneByRelationType[relationType];

  return (
    <button
      className={cn(
        'relative flex appearance-none items-center justify-center text-center font-sans font-medium outline-none',
        size === 'large' ? undefined : 'shadow-none',
        className,
      )}
      style={{
        background: theme.node.skill.background,
        borderColor: theme.node.skill.borderColor,
        borderRadius: theme.node.skill.borderRadius,
        borderStyle: 'solid',
        borderWidth: theme.node.skill.borderWidth,
        boxShadow: size === 'large' ? theme.node.skill.shadow : 'none',
        color: theme.node.skill.textColor,
        letterSpacing: theme.node.skill.typography.letterSpacing,
        maxWidth,
        minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth,
        ...(size === 'large'
          ? {
              fontSize: theme.node.skill.typography.large.fontSize,
              lineHeight: theme.node.skill.typography.large.lineHeight,
              minHeight: theme.graph.skill.large.minHeight,
              paddingBottom: theme.graph.skill.large.paddingY,
              paddingLeft: theme.graph.skill.large.paddingX,
              paddingRight: theme.graph.skill.large.paddingX,
              paddingTop: theme.graph.skill.large.paddingY,
            }
          : {
              fontSize: theme.node.skill.typography.small.fontSize,
              lineHeight: theme.node.skill.typography.small.lineHeight,
              minHeight: theme.graph.skill.small.minHeight,
              paddingBottom: theme.graph.skill.small.paddingY,
              paddingLeft: theme.graph.skill.small.paddingX,
              paddingRight: theme.graph.skill.small.paddingX,
              paddingTop: theme.graph.skill.small.paddingY,
            }),
        cursor: onClick ? 'pointer' : undefined,
      }}
      type="button"
      onClick={onClick}
    >
      <span
        ref={anchorRef}
        className="pointer-events-none absolute top-1/2 z-20 -translate-y-1/2"
        style={{
          left: side === 'left' ? `-${theme.graph.skill.anchorOffset}` : undefined,
          right: side === 'right' ? `-${theme.graph.skill.anchorOffset}` : undefined,
        }}
      >
        <RoadmapLinkIcon theme={theme} tone={linkTone} />
      </span>
      {skill.label}
    </button>
  );
}

export function MainNode({
  className,
  node,
  onClick,
  theme,
}: {
  className?: string;
  node: RoadmapGraphNode;
  onClick?: () => void;
  theme: RoadmapTheme;
}) {
  return (
    <button
      className={cn(
        'font-graph-node flex appearance-none items-center justify-center text-center font-normal outline-none',
        className,
      )}
      style={{
        background: theme.node.main.background,
        borderColor: theme.node.main.borderColor,
        borderRadius: theme.node.main.borderRadius,
        borderStyle: 'solid',
        borderWidth: theme.node.main.borderWidth,
        boxShadow: theme.node.main.shadow,
        color: theme.node.main.textColor,
        fontSize: theme.node.main.typography.fontSize,
        height: theme.node.main.height,
        lineHeight: theme.node.main.typography.lineHeight,
        paddingLeft: theme.node.main.paddingX,
        paddingRight: theme.node.main.paddingX,
        width: theme.node.main.width,
        cursor: onClick ? 'pointer' : undefined,
      }}
      type="button"
      onClick={onClick}
    >
      {node.label}
    </button>
  );
}
