'use client';

import { useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';

import type {
  RelationType,
  RoadmapGraphData,
  RoadmapGraphNode,
  RoadmapGraphSkill,
  RoadmapTheme,
} from '@/types/roadmap';

import {
  buildSmoothSkillPath,
  buildSmoothVerticalPath,
  getConnectorAnimation,
  getConnectorDashArray,
  getConnectorStroke,
  getConnectorStrokeWidth,
  getPoint,
  type ConnectorPath,
  type MeasuredPoint,
} from './roadmap-graph-connectors';
import { MainNode, SkillPill } from './roadmap-graph-primitives';

interface RoadmapGraphProps {
  activeNodeId?: string | null;
  graph: RoadmapGraphData;
  nodes: RoadmapGraphNode[];
  onNodeSelect?: (nodeId: string) => void;
  theme: RoadmapTheme;
}

interface FlattenedNode {
  node: RoadmapGraphNode;
}

interface SkillGroups {
  left: RoadmapGraphSkill[];
  right: RoadmapGraphSkill[];
}

function sortNodes(nodes: RoadmapGraphNode[]) {
  return [...nodes].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
}

function flattenRoadmapNodes(nodes: RoadmapGraphNode[]) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const childrenByParent = new Map<string | null, RoadmapGraphNode[]>();

  for (const node of nodes) {
    const parentId =
      node.parent_node_id && nodeMap.has(node.parent_node_id) ? node.parent_node_id : null;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(parentId, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
  }

  const flattened: FlattenedNode[] = [];

  function visit(parentId: string | null) {
    const children = childrenByParent.get(parentId) ?? [];

    for (const child of children) {
      flattened.push({ node: child });
      visit(child.id);
    }
  }

  visit(null);

  return flattened;
}

function splitSkills(skills: RoadmapGraphSkill[], rowIndex: number): SkillGroups {
  if (skills.length <= 2) {
    return {
      left: rowIndex % 2 === 0 ? [] : skills,
      right: rowIndex % 2 === 0 ? skills : [],
    };
  }

  if (skills.length >= 5) {
    const middle = Math.ceil(skills.length / 2);

    return {
      left: skills.slice(0, middle),
      right: skills.slice(middle),
    };
  }

  return {
    left: rowIndex % 2 === 0 ? [] : skills,
    right: rowIndex % 2 === 0 ? skills : [],
  };
}

function SkillStack({
  activeNodeId,
  align,
  nodeId,
  onNodeSelect,
  relationType,
  skills,
  skillAnchorRefs,
  theme,
}: {
  activeNodeId?: string | null;
  align: 'left' | 'right';
  nodeId: string;
  onNodeSelect?: (nodeId: string) => void;
  relationType: RelationType;
  skillAnchorRefs: MutableRefObject<Record<string, HTMLSpanElement | null>>;
  skills: RoadmapGraphSkill[];
  theme: RoadmapTheme;
}) {
  if (skills.length === 0) {
    return <div />;
  }

  const isLeft = align === 'left';

  return (
    <div className={`flex ${isLeft ? 'justify-end' : 'justify-start'}`}>
      <div className="flex flex-col" style={{ gap: `${theme.graph.skill.gap}px` }}>
        {skills.map((skill) => {
          const anchorKey = `${nodeId}:${align}:${skill.id}`;

          return (
            <SkillPill
              key={skill.id}
              className={
                activeNodeId === skill.roadmap_node_id ? 'ring-2 ring-violet-500/50' : undefined
              }
              maxWidth={theme.graph.skill.maxWidth}
              minWidth={theme.graph.skill.minWidth}
              anchorRef={(element) => {
                skillAnchorRefs.current[anchorKey] = element;
              }}
              relationType={relationType}
              side={isLeft ? 'right' : 'left'}
              skill={skill}
              theme={theme}
              onClick={onNodeSelect ? () => onNodeSelect(skill.roadmap_node_id) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

function GraphRow({
  activeNodeId,
  isLast,
  mainAnchorRefs,
  node,
  onNodeSelect,
  rowIndex,
  skillAnchorRefs,
  theme,
}: {
  activeNodeId?: string | null;
  isLast: boolean;
  mainAnchorRefs: MutableRefObject<Record<string, HTMLSpanElement | null>>;
  node: RoadmapGraphNode;
  onNodeSelect?: (nodeId: string) => void;
  rowIndex: number;
  skillAnchorRefs: MutableRefObject<Record<string, HTMLSpanElement | null>>;
  theme: RoadmapTheme;
}) {
  const skillGroups = splitSkills(node.skills, rowIndex);
  const leftHeight = getStackHeight(skillGroups.left.length, theme);
  const rightHeight = getStackHeight(skillGroups.right.length, theme);
  const rowHeight =
    Math.max(theme.graph.row.minHeight, leftHeight, rightHeight) + theme.graph.row.paddingY * 2;

  return (
    <div
      className="relative grid items-center"
      style={{
        gap: theme.graph.row.gap,
        gridTemplateColumns: `1fr ${theme.graph.row.nodeWidth} 1fr`,
        minHeight: `${rowHeight}px`,
      }}
    >
      <SkillStack
        activeNodeId={activeNodeId}
        align="left"
        nodeId={node.id}
        onNodeSelect={onNodeSelect}
        relationType={node.relation_type}
        skillAnchorRefs={skillAnchorRefs}
        skills={skillGroups.left}
        theme={theme}
      />

      <div className="relative z-10">
        <span
          ref={(element) => {
            mainAnchorRefs.current[`${node.id}:top`] = element;
          }}
          className="absolute top-0 left-1/2 size-0 -translate-x-1/2"
        />
        <span
          ref={(element) => {
            mainAnchorRefs.current[`${node.id}:left`] = element;
          }}
          className="absolute top-1/2 left-0 size-0 -translate-y-1/2"
        />
        <span
          ref={(element) => {
            mainAnchorRefs.current[`${node.id}:right`] = element;
          }}
          className="absolute top-1/2 right-0 size-0 -translate-y-1/2"
        />
        {!isLast ? (
          <span
            ref={(element) => {
              mainAnchorRefs.current[`${node.id}:bottom`] = element;
            }}
            className="absolute bottom-0 left-1/2 size-0 -translate-x-1/2"
          />
        ) : null}
        <MainNode
          className={activeNodeId === node.id ? 'ring-2 ring-violet-500/50' : undefined}
          node={node}
          theme={theme}
          onClick={onNodeSelect ? () => onNodeSelect(node.id) : undefined}
        />
      </div>

      <SkillStack
        activeNodeId={activeNodeId}
        align="right"
        nodeId={node.id}
        onNodeSelect={onNodeSelect}
        relationType={node.relation_type}
        skillAnchorRefs={skillAnchorRefs}
        skills={skillGroups.right}
        theme={theme}
      />
    </div>
  );
}

function getStackHeight(count: number, theme: RoadmapTheme) {
  if (count === 0) {
    return 0;
  }

  return count * theme.graph.skill.pillHeight + (count - 1) * theme.graph.skill.gap;
}

export function RoadmapGraph({
  activeNodeId,
  graph,
  nodes,
  onNodeSelect,
  theme,
}: RoadmapGraphProps) {
  const orderedNodes = useMemo(() => flattenRoadmapNodes(sortNodes(nodes)), [nodes]);
  const graphRef = useRef<HTMLDivElement | null>(null);
  const mainAnchorRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const skillAnchorRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const titleTopAnchorRef = useRef<HTMLSpanElement | null>(null);
  const titleAnchorRef = useRef<HTMLSpanElement | null>(null);
  const [paths, setPaths] = useState<ConnectorPath[]>([]);

  useLayoutEffect(() => {
    const container = graphRef.current;

    if (!container) {
      return;
    }

    const measure = () => {
      const nextPaths: ConnectorPath[] = [];
      const firstNode = orderedNodes[0]?.node;
      const titleTopPoint = getPoint(container, titleTopAnchorRef.current);
      const titleBottomPoint = getPoint(container, titleAnchorRef.current);

      if (titleTopPoint && titleBottomPoint) {
        nextPaths.push({
          d: buildSmoothVerticalPath(titleTopPoint, titleBottomPoint),
          tone: 'header',
        });
      }

      if (firstNode) {
        const firstTopPoint = getPoint(
          container,
          mainAnchorRefs.current[`${firstNode.id}:top`] ?? null,
        );

        if (titleBottomPoint && firstTopPoint) {
          nextPaths.push({
            d: buildSmoothVerticalPath(titleBottomPoint, firstTopPoint),
            tone: 'header',
          });
        }
      }

      for (let index = 0; index < orderedNodes.length - 1; index += 1) {
        const currentNode = orderedNodes[index]?.node;
        const nextNode = orderedNodes[index + 1]?.node;

        if (!currentNode || !nextNode) {
          continue;
        }

        const bottomPoint = getPoint(
          container,
          mainAnchorRefs.current[`${currentNode.id}:bottom`] ?? null,
        );
        const topPoint = getPoint(container, mainAnchorRefs.current[`${nextNode.id}:top`] ?? null);

        if (bottomPoint && topPoint) {
          nextPaths.push({
            d: buildSmoothVerticalPath(bottomPoint, topPoint),
            tone: 'main',
          });
        }
      }

      for (let rowIndex = 0; rowIndex < orderedNodes.length; rowIndex += 1) {
        const node = orderedNodes[rowIndex]?.node;

        if (!node) {
          continue;
        }

        const groups = splitSkills(node.skills, rowIndex);

        for (const align of ['left', 'right'] as const) {
          const skills = align === 'left' ? groups.left : groups.right;

          if (skills.length === 0) {
            continue;
          }

          const mainPoint = getPoint(
            container,
            mainAnchorRefs.current[`${node.id}:${align === 'left' ? 'left' : 'right'}`] ?? null,
          );

          const skillPoints = skills
            .map((skill) =>
              getPoint(
                container,
                skillAnchorRefs.current[`${node.id}:${align}:${skill.id}`] ?? null,
              ),
            )
            .filter((point): point is MeasuredPoint => point !== null);

          if (!mainPoint || skillPoints.length === 0) {
            continue;
          }

          for (const point of skillPoints) {
            nextPaths.push({
              d: buildSmoothSkillPath(mainPoint, point),
              tone: node.relation_type,
            });
          }
        }
      }

      setPaths(nextPaths);
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);

    for (const element of Object.values(mainAnchorRefs.current)) {
      if (element) {
        resizeObserver.observe(element);
      }
    }

    for (const element of Object.values(skillAnchorRefs.current)) {
      if (element) {
        resizeObserver.observe(element);
      }
    }

    window.addEventListener('resize', measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [orderedNodes]);

  return (
    <div className="mx-auto" style={{ maxWidth: theme.graph.card.maxWidth }}>
      <div
        className="relative overflow-hidden bg-white"
        style={{
          borderRadius: theme.graph.card.borderRadius,
          paddingBottom: theme.graph.card.paddingBottom,
          paddingLeft: theme.graph.card.paddingX,
          paddingRight: theme.graph.card.paddingX,
          paddingTop: theme.graph.card.paddingTop,
        }}
      >
        <div
          className="pointer-events-none absolute"
          style={{
            height: theme.graph.illustration.height,
            left: theme.graph.illustration.left,
            opacity: theme.graph.illustration.opacity,
            top: theme.graph.illustration.top,
            width: theme.graph.illustration.width,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="block h-full w-full object-contain"
            alt={graph.illustrationAlt}
            src={graph.illustrationSrc}
          />
        </div>

        <div
          ref={graphRef}
          className="relative mx-auto"
          style={{ maxWidth: theme.graph.contentMaxWidth }}
        >
          <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible">
            {paths.map((path, index) => (
              <path
                key={`${path.tone}-${index}`}
                style={{ animation: getConnectorAnimation(path.tone, theme) }}
                fill="none"
                d={path.d}
                stroke={getConnectorStroke(path.tone, theme)}
                strokeDasharray={getConnectorDashArray(path.tone, theme)}
                strokeDashoffset="0"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={getConnectorStrokeWidth(path.tone, theme)}
              />
            ))}
          </svg>

          <div
            className="relative mx-auto flex flex-col items-center"
            style={{
              marginBottom: theme.graph.title.marginBottom,
              maxWidth: theme.graph.title.maxWidth,
            }}
          >
            <span
              ref={titleTopAnchorRef}
              className="absolute top-0 left-1/2 size-0 -translate-x-1/2"
            />
            <div
              className="mb-7"
              style={{
                height: theme.graph.title.stemHeight,
                width: theme.graph.title.stemWidth,
              }}
            />
            <p
              className="font-graph-heading relative z-10 text-center font-medium"
              style={{
                background: theme.graph.title.background,
                color: theme.graph.title.typography.color,
                fontSize: theme.graph.title.typography.fontSize,
                letterSpacing: theme.graph.title.typography.letterSpacing,
                lineHeight: theme.graph.title.typography.lineHeight,
                paddingLeft: theme.graph.title.typography.paddingX,
                paddingRight: theme.graph.title.typography.paddingX,
              }}
            >
              {graph.title}
            </p>
            <span
              ref={titleAnchorRef}
              className="absolute bottom-[-40px] left-1/2 size-0 -translate-x-1/2"
              style={{ bottom: theme.graph.title.bottomAnchorOffset }}
            />
          </div>

          <style>{`
            @keyframes roadmap-dash {
              to {
                stroke-dashoffset: -${theme.connector.dashOffsetStep};
              }
            }
          `}</style>

          <div className="relative z-10">
            {orderedNodes.map(({ node }, index) => (
              <GraphRow
                key={node.id}
                activeNodeId={activeNodeId}
                isLast={index === orderedNodes.length - 1}
                mainAnchorRefs={mainAnchorRefs}
                node={node}
                onNodeSelect={onNodeSelect}
                rowIndex={index}
                skillAnchorRefs={skillAnchorRefs}
                theme={theme}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
