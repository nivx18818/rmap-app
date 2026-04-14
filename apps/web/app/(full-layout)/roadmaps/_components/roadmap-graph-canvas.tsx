'use client';

import { cn } from '@repo/design-system/lib/utils';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import type { MockRoadmapLayout, MockRoadmapLogic } from '@/lib/data/roadmaps/roadmap-mock.types';
import type { RelationType } from '@/types/roadmap';

import { RoadmapLinkIcon } from '@/components/roadmap/roadmap-icons';

type Anchor = 'top' | 'right' | 'bottom' | 'left';
type Kind = 'title' | 'main' | 'sub';
type EdgeVariant = 'main' | 'optional' | 'required';
type IconTone = 'green' | 'purple';
type BranchDirection = 'left' | 'right';
type Point = { x: number; y: number };
type ConnectorStyle = {
  dashArray: string;
  stroke: string;
  strokeWidth: number;
};
type NodePresentation = {
  containerClassName: string;
  dimensions: {
    height: number;
    width: number;
  };
  labelClassName: string;
};

const ROADMAP_LINK_ICON_BADGE_SIZE = 17;
const GRAPH_PADDING = 180;
const DEFAULT_ANCHORS = { source: 'bottom', target: 'top' } as const satisfies {
  source: Anchor;
  target: Anchor;
};
const NODE_CONFIG_BY_KIND = {
  main: {
    containerClassName:
      'z-20 border-[3px] border-roadmap-connector-main bg-roadmap-node-main text-roadmap-title-foreground shadow-none',
    dimensions: { height: 60, width: 220 },
    labelClassName: 'font-semibold',
  },
  sub: {
    containerClassName:
      'z-10 border-[3px] border-roadmap-connector-main bg-roadmap-node-skill text-roadmap-node-skill-foreground shadow-roadmap-node-skill',
    dimensions: { height: 52, width: 300 },
    labelClassName: 'font-semibold',
  },
  title: {
    containerClassName:
      'z-30 border border-border bg-card text-foreground shadow-roadmap-logic-title',
    dimensions: { height: 74, width: 260 },
    labelClassName: 'text-lg font-extrabold',
  },
} as const satisfies Record<Kind, NodePresentation>;

const ANCHOR_POINT_BY_ANCHOR = {
  bottom: (box: NodeBox) => ({ x: box.x + box.width / 2, y: box.y + box.height }),
  left: (box: NodeBox) => ({ x: box.x, y: box.y + box.height / 2 }),
  right: (box: NodeBox) => ({ x: box.x + box.width, y: box.y + box.height / 2 }),
  top: (box: NodeBox) => ({ x: box.x + box.width / 2, y: box.y }),
} satisfies Record<Anchor, (box: NodeBox) => Point>;

const MAIN_TO_SUB_ANCHORS = {
  left: { source: 'left', target: 'right' },
  right: { source: 'right', target: 'left' },
} satisfies Record<BranchDirection, { source: Anchor; target: Anchor }>;

const RELATION_TYPE_TO_ICON_TONE = {
  optional: 'green',
  required: 'purple',
} satisfies Record<RelationType, IconTone>;

const CONNECTOR_STYLE_BY_VARIANT = {
  main: {
    dashArray: '10 10',
    stroke: 'var(--color-roadmap-connector-main)',
    strokeWidth: 4,
  },
  optional: {
    dashArray: '8 10',
    stroke: 'var(--color-roadmap-connector-optional)',
    strokeWidth: 3.5,
  },
  required: {
    dashArray: '8 10',
    stroke: 'var(--color-roadmap-connector-required)',
    strokeWidth: 3.5,
  },
} as const satisfies Record<EdgeVariant, ConnectorStyle>;

interface RoadmapGraphCanvasProps {
  layout: MockRoadmapLayout;
  logic: MockRoadmapLogic;
}

interface NodeBox {
  height: number;
  width: number;
  x: number;
  y: number;
}

interface EdgeIcon {
  tone: IconTone;
  x: number;
  y: number;
}

interface EdgeItem {
  dashArray: string;
  icon: EdgeIcon | null;
  id: string;
  path: string;
  stroke: string;
  strokeWidth: number;
}

function getNodeDimensions(kind: Kind) {
  return NODE_CONFIG_BY_KIND[kind].dimensions;
}

function getAnchorPoint(box: NodeBox, anchor: Anchor) {
  return ANCHOR_POINT_BY_ANCHOR[anchor](box);
}

function buildSmoothSkillPath(from: Point, to: Point) {
  const dx = to.x - from.x;
  const tension = Math.min(Math.abs(dx) * 0.6, 80);
  const dirX = dx >= 0 ? 1 : -1;

  const cp1x = from.x + dirX * tension;
  const cp2x = to.x - dirX * tension;

  return `M ${from.x} ${from.y} C ${cp1x} ${from.y}, ${cp2x} ${to.y}, ${to.x} ${to.y}`;
}

function buildSmoothVerticalPath(from: Point, to: Point) {
  const midY = (from.y + to.y) / 2;

  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
}

function buildOrthogonalMainPath(from: Point, to: Point) {
  if (from.x === to.x) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }

  const midY = (from.y + to.y) / 2;

  return `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`;
}

function edgeVariantForNode(parentKind: Kind, childKind: Kind, relationType?: RelationType) {
  if (parentKind === 'main' && childKind === 'main') {
    return 'main' satisfies EdgeVariant;
  }

  return relationType ?? 'required';
}

function branchAnchors(parentX: number, childX: number) {
  if (childX < parentX) {
    return MAIN_TO_SUB_ANCHORS.left;
  }

  return MAIN_TO_SUB_ANCHORS.right;
}

export function RoadmapGraphCanvas({ layout, logic }: RoadmapGraphCanvasProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  const { edges, height, nodes, width } = useMemo(() => {
    const logicNodeById = new Map(logic.nodes.map((node) => [node.id, node] as const));

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

    const canvasWidth = Math.ceil(maxX - minX + GRAPH_PADDING * 2);
    const canvasHeight = Math.ceil(maxY - minY + GRAPH_PADDING * 2);
    const normalizeX = (x: number) => x - minX + GRAPH_PADDING;
    const normalizeY = (y: number) => y - minY + GRAPH_PADDING;

    const normalizedNodes = layoutEntries.map((entry) => ({
      ...entry,
      renderX: normalizeX(entry.position.x),
      renderY: normalizeY(entry.position.y),
    }));
    const normalizedNodeById = new Map(normalizedNodes.map((node) => [node.nodeId, node] as const));

    const edgeItems = normalizedNodes.flatMap((node) => {
      if (!node.parentId) {
        return [];
      }

      const parent = normalizedNodeById.get(node.parentId);
      if (!parent) {
        return [];
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
      const edgeVariant = edgeVariantForNode(parent.kind, node.kind, node.relationType);
      const connectorStyle = CONNECTOR_STYLE_BY_VARIANT[edgeVariant];

      const { source: sourceAnchor, target: targetAnchor } = isMainToSub
        ? branchAnchors(parent.renderX, node.renderX)
        : DEFAULT_ANCHORS;

      const start = getAnchorPoint(sourceBox, sourceAnchor);
      const end = getAnchorPoint(targetBox, targetAnchor);

      return [
        {
          dashArray: connectorStyle.dashArray,
          icon: isMainToSub
            ? {
                tone: RELATION_TYPE_TO_ICON_TONE[node.relationType ?? 'required'],
                x: end.x,
                y: end.y,
              }
            : null,
          id: `${parent.nodeId}->${node.nodeId}`,
          path: isMainToMain
            ? buildOrthogonalMainPath(start, end)
            : isMainToSub
              ? buildSmoothSkillPath(start, end)
              : buildSmoothVerticalPath(start, end),
          stroke: connectorStyle.stroke,
          strokeWidth: connectorStyle.strokeWidth,
        } satisfies EdgeItem,
      ];
    });

    return {
      edges: edgeItems,
      height: canvasHeight,
      nodes: normalizedNodes,
      width: canvasWidth,
    };
  }, [layout.nodes, logic.nodes]);

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
    return <div className="roadmap-graph-empty">No roadmap data to render.</div>;
  }

  const scale = width > 0 ? Math.min(1, (viewportWidth || width) / width) : 1;
  const scaledHeight = Math.ceil(height * scale);

  return (
    <div className="roadmap-graph-shell">
      <div ref={viewportRef} className="surface-roadmap-grid relative w-full">
        <div className="relative" style={{ height: scaledHeight }}>
          <div
            className="absolute top-0 left-0 origin-top-left"
            style={{ height, transform: `scale(${scale})`, width }}
          >
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
                  strokeDasharray={edge.dashArray}
                  strokeLinecap="round"
                />
              ))}
            </svg>

            {edges.map((edge) => {
              if (!edge.icon) {
                return null;
              }

              const left = edge.icon.x - ROADMAP_LINK_ICON_BADGE_SIZE / 2;
              const top = edge.icon.y - ROADMAP_LINK_ICON_BADGE_SIZE / 2;

              return (
                <div
                  key={`${edge.id}-icon`}
                  className="pointer-events-none absolute z-15"
                  style={{ left, top }}
                >
                  <RoadmapLinkIcon tone={edge.icon.tone} />
                </div>
              );
            })}

            {nodes.map((node) => {
              const left = node.renderX - node.width / 2;
              const top = node.renderY - node.height / 2;

              return (
                <div
                  key={node.nodeId}
                  className={cn(
                    'absolute flex items-center justify-center rounded-xl border px-4 py-2 text-center leading-tight',
                    NODE_CONFIG_BY_KIND[node.kind].containerClassName,
                  )}
                  style={{
                    height: node.height,
                    left,
                    top,
                    width: node.width,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className={NODE_CONFIG_BY_KIND[node.kind].labelClassName}>
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
