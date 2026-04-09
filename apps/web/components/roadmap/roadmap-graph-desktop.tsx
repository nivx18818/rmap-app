'use client';

import { useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';

import type { RelationType, RoadmapNode, SkillNode } from '@/types/roadmap';

import { FIGMA_GRAPH_ILLUSTRATION } from './roadmap-graph-layout';
import { MainNode, SkillPill } from './roadmap-graph-primitives';

interface RoadmapGraphDesktopProps {
  nodes: RoadmapNode[];
}

interface FlattenedNode {
  node: RoadmapNode;
}

interface SkillGroups {
  left: SkillNode[];
  right: SkillNode[];
}

interface MeasuredPoint {
  x: number;
  y: number;
}

interface ConnectorPath {
  d: string;
  tone: 'header' | 'main' | RelationType;
}

const SKILL_GAP = 12;
const SKILL_PILL_HEIGHT = 52;
const ROW_PADDING_Y = 28;

function sortNodes(nodes: RoadmapNode[]) {
  return [...nodes].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
}

function flattenRoadmapNodes(nodes: RoadmapNode[]) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const childrenByParent = new Map<string | null, RoadmapNode[]>();

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

function splitSkills(skills: SkillNode[], rowIndex: number): SkillGroups {
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

function getStackHeight(count: number) {
  if (count === 0) {
    return 0;
  }

  return count * SKILL_PILL_HEIGHT + (count - 1) * SKILL_GAP;
}

function getPoint(container: HTMLDivElement, element: HTMLElement | null): MeasuredPoint | null {
  if (!element) {
    return null;
  }

  const containerRect = container.getBoundingClientRect();
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left - containerRect.left + rect.width / 2,
    y: rect.top - containerRect.top + rect.height / 2,
  };
}

function buildSmoothVerticalPath(from: MeasuredPoint, to: MeasuredPoint) {
  const midY = (from.y + to.y) / 2;

  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
}

function buildSmoothSkillPath(from: MeasuredPoint, to: MeasuredPoint) {
  const dx = to.x - from.x;
  const tension = Math.min(Math.abs(dx) * 0.6, 80);
  const dirX = dx >= 0 ? 1 : -1;

  const cp1x = from.x + dirX * tension;
  const cp1y = from.y;
  const cp2x = to.x - dirX * tension;
  const cp2y = to.y;

  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
}

function getConnectorStroke(tone: ConnectorPath['tone']) {
  if (tone === 'main') {
    return '#111827';
  }

  if (tone === 'header') {
    return '#4f46e5';
  }

  return tone === 'optional' ? '#22c55e' : '#8b5cf6';
}

function getConnectorDashArray(tone: ConnectorPath['tone']) {
  if (tone === 'header') {
    return '1 15';
  }

  return tone === 'main' ? '10 10' : '8 10';
}

function getConnectorStrokeWidth(tone: ConnectorPath['tone']) {
  if (tone === 'header') {
    return '6';
  }

  return tone === 'main' ? '4' : '3.5';
}

function getConnectorAnimation(tone: ConnectorPath['tone']) {
  if (tone === 'main') {
    return 'roadmap-dash 1.8s linear infinite';
  }

  if (tone === 'header') {
    return undefined;
  }

  return 'roadmap-dash 2.4s linear infinite';
}

function SkillStack({
  align,
  nodeId,
  relationType,
  skills,
  skillAnchorRefs,
}: {
  align: 'left' | 'right';
  nodeId: string;
  relationType: RelationType;
  skillAnchorRefs: MutableRefObject<Record<string, HTMLSpanElement | null>>;
  skills: SkillNode[];
}) {
  if (skills.length === 0) {
    return <div />;
  }

  const isLeft = align === 'left';

  return (
    <div className={`flex ${isLeft ? 'justify-end' : 'justify-start'}`}>
      <div className="flex flex-col" style={{ gap: `${SKILL_GAP}px` }}>
        {skills.map((skill) => {
          const anchorKey = `${nodeId}:${align}:${skill.id}`;

          return (
            <SkillPill
              key={skill.id}
              className="max-w-[360px] min-w-[220px]"
              anchorRef={(element) => {
                skillAnchorRefs.current[anchorKey] = element;
              }}
              relationType={relationType}
              side={isLeft ? 'right' : 'left'}
              skill={skill}
            />
          );
        })}
      </div>
    </div>
  );
}

function GraphRow({
  isLast,
  mainAnchorRefs,
  node,
  rowIndex,
  skillAnchorRefs,
}: {
  isLast: boolean;
  mainAnchorRefs: MutableRefObject<Record<string, HTMLSpanElement | null>>;
  node: RoadmapNode;
  rowIndex: number;
  skillAnchorRefs: MutableRefObject<Record<string, HTMLSpanElement | null>>;
}) {
  const skillGroups = splitSkills(node.skills, rowIndex);
  const leftHeight = getStackHeight(skillGroups.left.length);
  const rightHeight = getStackHeight(skillGroups.right.length);
  const rowHeight = Math.max(120, leftHeight, rightHeight) + ROW_PADDING_Y * 2;

  return (
    <div
      className="relative grid grid-cols-[1fr_300px_1fr] items-center gap-14"
      style={{ minHeight: `${rowHeight}px` }}
    >
      <SkillStack
        align="left"
        nodeId={node.id}
        relationType={node.relation_type}
        skillAnchorRefs={skillAnchorRefs}
        skills={skillGroups.left}
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

        <MainNode node={node} />
      </div>

      <SkillStack
        align="right"
        nodeId={node.id}
        relationType={node.relation_type}
        skillAnchorRefs={skillAnchorRefs}
        skills={skillGroups.right}
      />
    </div>
  );
}

export function RoadmapGraphDesktop({ nodes }: RoadmapGraphDesktopProps) {
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

    const resizeObserver = new ResizeObserver(() => {
      measure();
    });

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
    <div className="hidden xl:block">
      <div className="mx-auto max-w-[1480px]">
        <div className="relative overflow-hidden rounded-[40px] bg-white px-16 pt-10 pb-20">
          <div className="pointer-events-none absolute top-[120px] left-[36px] h-[322px] w-[344px] opacity-95">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="block h-full w-full object-contain"
              alt=""
              src={FIGMA_GRAPH_ILLUSTRATION}
            />
          </div>

          <div ref={graphRef} className="relative mx-auto max-w-[1240px]">
            <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible">
              {paths.map((path, index) => (
                <path
                  key={`${path.tone}-${index}`}
                  style={{
                    animation: getConnectorAnimation(path.tone),
                  }}
                  fill="none"
                  d={path.d}
                  stroke={getConnectorStroke(path.tone)}
                  strokeDasharray={getConnectorDashArray(path.tone)}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={getConnectorStrokeWidth(path.tone)}
                />
              ))}
            </svg>

            <div className="relative mx-auto mb-10 flex max-w-[420px] flex-col items-center">
              <span
                ref={titleTopAnchorRef}
                className="absolute top-0 left-1/2 size-0 -translate-x-1/2"
              />
              <div className="mb-7 h-[126px] w-[6px]" />
              <p className="font-graph-heading relative z-10 bg-white px-6 text-center text-[24px] leading-[132.5%] font-medium tracking-[-0.48px] text-black">
                Front-end
              </p>
              <span
                ref={titleAnchorRef}
                className="absolute bottom-[-40px] left-1/2 size-0 -translate-x-1/2"
              />
            </div>

            <style>{`
              @keyframes roadmap-dash {
                to {
                  stroke-dashoffset: -24;
                }
              }
            `}</style>
            <div className="relative z-10">
              {orderedNodes.map(({ node }, index) => (
                <GraphRow
                  key={node.id}
                  isLast={index === orderedNodes.length - 1}
                  mainAnchorRefs={mainAnchorRefs}
                  node={node}
                  rowIndex={index}
                  skillAnchorRefs={skillAnchorRefs}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
