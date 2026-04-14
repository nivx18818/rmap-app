'use client';

import Image from 'next/image';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { MockRoadmapLayout, MockRoadmapLogic } from '@/lib/data/roadmaps/roadmap-mock.types';
import type { RoadmapTheme } from '@/types/roadmap';

import { RoadmapLinkIcon } from '@/components/roadmap/roadmap-icons';

type Anchor = 'top' | 'right' | 'bottom' | 'left';

const GRAPH_ILLUSTRATION = {
  alt: 'Frontend roadmap visual accent',
  src: 'https://www.figma.com/api/mcp/asset/321a7f38-8b35-4b87-b70d-37a26045c973',
};

interface RoadmapGraphCanvasProps {
  activeNodeId?: string | null;
  layout: MockRoadmapLayout;
  logic: MockRoadmapLogic;
  onNodeSelect?: (nodeId: string) => void;
  theme: RoadmapTheme;
}

interface NodeBox {
  height: number;
  width: number;
  x: number;
  y: number;
}

function getNodeDimensions(kind: 'title' | 'main' | 'sub') {
  if (kind === 'title') {
    return { height: 74, width: 260 };
  }

  if (kind === 'main') {
    return { height: 60, width: 220 };
  }

  return { height: 52, width: 300 };
}

function getAnchorPoint(box: NodeBox, anchor: Anchor) {
  if (anchor === 'top') {
    return { x: box.x + box.width / 2, y: box.y };
  }

  if (anchor === 'right') {
    return { x: box.x + box.width, y: box.y + box.height / 2 };
  }

  if (anchor === 'left') {
    return { x: box.x, y: box.y + box.height / 2 };
  }

  return { x: box.x + box.width / 2, y: box.y + box.height };
}

function buildSmoothSkillPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const tension = Math.min(Math.abs(dx) * 0.6, 80);
  const dirX = dx >= 0 ? 1 : -1;

  const cp1x = from.x + dirX * tension;
  const cp2x = to.x - dirX * tension;

  return `M ${from.x} ${from.y} C ${cp1x} ${from.y}, ${cp2x} ${to.y}, ${to.x} ${to.y}`;
}

function buildSmoothVerticalPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const midY = (from.y + to.y) / 2;

  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
}

function mergeBoxShadow(baseShadow: string, ringColor?: string) {
  if (!ringColor) {
    return baseShadow;
  }

  return baseShadow === 'none' ? `0 0 0 2px ${ringColor}` : `${baseShadow}, 0 0 0 2px ${ringColor}`;
}

function nodeTone(kind: 'title' | 'main' | 'sub', theme: RoadmapTheme) {
  if (kind === 'title') {
    return {
      background: 'var(--color-card)',
      borderColor: 'var(--color-border)',
      borderWidth: '1px',
      boxShadow: 'var(--shadow-roadmap-logic-title)',
      color: 'var(--color-foreground)',
    };
  }

  if (kind === 'main') {
    return {
      background: theme.node.main.background,
      borderColor: theme.node.main.borderColor,
      borderWidth: theme.node.main.borderWidth,
      boxShadow: theme.node.main.shadow,
      color: theme.node.main.textColor,
    };
  }

  return {
    background: theme.node.skill.background,
    borderColor: theme.node.skill.borderColor,
    borderWidth: theme.node.skill.borderWidth,
    boxShadow: theme.node.skill.shadow,
    color: theme.node.skill.textColor,
  };
}

export function RoadmapGraphCanvas({
  activeNodeId,
  layout,
  logic,
  onNodeSelect,
  theme,
}: RoadmapGraphCanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  const { edges, height, nodes, width } = useMemo(() => {
    const logicNodeById = new Map(logic.nodes.map((node) => [node.id, node]));

    const layoutEntries = layout.nodes
      .map((entry) => {
        const logicNode = logicNodeById.get(entry.nodeId);
        if (!logicNode) {
          return null;
        }

        const { height: nodeHeight, width: nodeWidth } = getNodeDimensions(logicNode.kind);

        return {
          ...entry,
          height: nodeHeight,
          kind: logicNode.kind,
          label: logicNode.label,
          parentId: logicNode.parentId,
          position: entry.position,
          relationType: logicNode.relationType,
          width: nodeWidth,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    const minX = Math.min(...layoutEntries.map((entry) => entry.position.x - entry.width / 2));
    const minY = Math.min(...layoutEntries.map((entry) => entry.position.y - entry.height / 2));
    const maxX = Math.max(...layoutEntries.map((entry) => entry.position.x + entry.width / 2));
    const maxY = Math.max(...layoutEntries.map((entry) => entry.position.y + entry.height / 2));

    const padding = 180;
    const canvasWidth = Math.ceil(maxX - minX + padding * 2);
    const canvasHeight = Math.ceil(maxY - minY + padding * 2);
    const normalizeX = (x: number) => x - minX + padding;
    const normalizeY = (y: number) => y - minY + padding;

    const normalizedNodes = layoutEntries.map((entry) => ({
      ...entry,
      renderX: normalizeX(entry.position.x),
      renderY: normalizeY(entry.position.y),
    }));

    const edgeItems = normalizedNodes
      .filter((node) => node.parentId)
      .map((node) => {
        const parent = normalizedNodes.find((candidate) => candidate.nodeId === node.parentId);
        if (!parent) {
          return null;
        }

        const sourceBox: NodeBox = {
          height: parent.height,
          width: parent.width,
          x: parent.renderX - parent.width / 2,
          y: parent.renderY - parent.height / 2,
        };
        const targetBox: NodeBox = {
          height: node.height,
          width: node.width,
          x: node.renderX - node.width / 2,
          y: node.renderY - node.height / 2,
        };

        const isMainToMain = parent.kind === 'main' && node.kind === 'main';
        const isMainToSub = parent.kind === 'main' && node.kind === 'sub';

        let sourceAnchor: Anchor = 'bottom';
        let targetAnchor: Anchor = 'top';

        if (isMainToSub) {
          const isLeftBranch = node.renderX < parent.renderX;
          if (isLeftBranch) {
            sourceAnchor = 'left';
            targetAnchor = 'right';
          } else {
            sourceAnchor = 'right';
            targetAnchor = 'left';
          }
        }

        const start = getAnchorPoint(sourceBox, sourceAnchor);
        const end = getAnchorPoint(targetBox, targetAnchor);

        return {
          dashed: isMainToSub,
          id: `${parent.nodeId}->${node.nodeId}`,
          icon: isMainToSub
            ? {
                tone: (node.relationType === 'required' ? 'purple' : 'green') as 'green' | 'purple',
                x: end.x,
                y: end.y,
              }
            : null,
          path: isMainToSub
            ? buildSmoothSkillPath(start, end)
            : buildSmoothVerticalPath(start, end),
          stroke: isMainToMain
            ? theme.connector.main.stroke
            : node.relationType === 'optional'
              ? theme.connector.optional.stroke
              : theme.connector.required.stroke,
          strokeWidth: isMainToMain
            ? theme.connector.main.strokeWidth
            : node.relationType === 'optional'
              ? theme.connector.optional.strokeWidth
              : theme.connector.required.strokeWidth,
        };
      })
      .filter((edge): edge is NonNullable<typeof edge> => Boolean(edge));

    return {
      edges: edgeItems,
      height: canvasHeight,
      nodes: normalizedNodes,
      width: canvasWidth,
    };
  }, [
    layout.nodes,
    logic.nodes,
    theme.connector.main.stroke,
    theme.connector.main.strokeWidth,
    theme.connector.optional.stroke,
    theme.connector.optional.strokeWidth,
    theme.connector.required.stroke,
    theme.connector.required.strokeWidth,
  ]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const measure = () => {
      setViewportWidth(viewport.clientWidth);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(viewport);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (nodes.length === 0) {
    return (
      <div
        className="rounded-2xl border p-8 text-sm"
        style={{
          background: 'var(--color-card)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-muted-foreground)',
        }}
      >
        No roadmap data to render.
      </div>
    );
  }

  const scale = width > 0 ? Math.min(1, (viewportWidth || width) / width) : 1;
  const scaledHeight = Math.ceil(height * scale);

  return (
    <div
      className="w-full overflow-hidden rounded-2xl border"
      style={{
        background: 'var(--color-roadmap-logic-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-roadmap-logic-title)',
      }}
    >
      <div ref={viewportRef} className="surface-roadmap-grid relative w-full">
        <div className="relative" style={{ height: scaledHeight }}>
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{ height, transform: `scale(${scale})`, width }}
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
              <Image
                className="object-contain"
                fill
                alt={GRAPH_ILLUSTRATION.alt}
                src={GRAPH_ILLUSTRATION.src}
                unoptimized
              />
            </div>
            <svg
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
              height={height}
              width={width}
              viewBox={`0 0 ${width} ${height}`}
            >
              {edges.map((edge) => (
                <path
                  key={edge.id}
                  fill="none"
                  d={edge.path}
                  stroke={edge.stroke}
                  strokeWidth={edge.strokeWidth}
                  strokeDasharray={
                    edge.dashed
                      ? theme.connector.required.dashArray
                      : theme.connector.main.dashArray
                  }
                  strokeLinecap="round"
                />
              ))}
            </svg>

            {edges.map((edge) => {
              if (!edge.icon) {
                return null;
              }

              const iconSize = Number.parseFloat(theme.icon.roadmapLink.badgeSize);
              const left = edge.icon.x - iconSize / 2;
              const top = edge.icon.y - iconSize / 2;

              return (
                <div
                  key={`${edge.id}-icon`}
                  className="pointer-events-none absolute"
                  style={{ left, top, zIndex: 15 }}
                >
                  <RoadmapLinkIcon theme={theme} tone={edge.icon.tone} />
                </div>
              );
            })}

            {nodes.map((node) => {
              const left = node.renderX - node.width / 2;
              const tone = nodeTone(node.kind, theme);
              const top = node.renderY - node.height / 2;

              return (
                <div
                  key={node.nodeId}
                  className="absolute flex items-center justify-center rounded-xl border px-4 py-2 text-center leading-tight"
                  style={{
                    background: tone.background,
                    borderColor: tone.borderColor,
                    borderStyle: 'solid',
                    borderWidth: tone.borderWidth,
                    boxShadow:
                      activeNodeId === node.nodeId
                        ? mergeBoxShadow(tone.boxShadow, theme.graph.selectionRingColor)
                        : tone.boxShadow,
                    color: tone.color,
                    height: node.height,
                    left,
                    top,
                    width: node.width,
                    zIndex: node.kind === 'title' ? 30 : node.kind === 'main' ? 20 : 10,
                    cursor: node.kind === 'title' || !onNodeSelect ? undefined : 'pointer',
                  }}
                  role={node.kind === 'title' || !onNodeSelect ? undefined : 'button'}
                  tabIndex={node.kind === 'title' || !onNodeSelect ? undefined : 0}
                  onKeyDown={
                    node.kind === 'title' || !onNodeSelect
                      ? undefined
                      : (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onNodeSelect(node.nodeId);
                          }
                        }
                  }
                  onClick={
                    node.kind === 'title' || !onNodeSelect
                      ? undefined
                      : () => {
                          onNodeSelect(node.nodeId);
                        }
                  }
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={node.kind === 'title' ? 'text-lg font-extrabold' : 'font-semibold'}
                    >
                      {node.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
