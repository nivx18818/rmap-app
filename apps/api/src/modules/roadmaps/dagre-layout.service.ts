/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import * as dagre from '@dagrejs/dagre';
import { Injectable } from '@nestjs/common';

import type { FlatNode } from './types/ai-roadmap.types';

/**
 * Computes a top-to-bottom Dagre layout for a flat list of roadmap nodes.
 *
 * Coordinates are calculated ONCE during generation and persisted to
 * roadmap_nodes.pos_x / pos_y — never recalculated client-side.
 */
@Injectable()
export class DagreLayoutService {
  /**
   * @param nodes Flat node list with tempId / tempParentId assigned.
   * @returns Map of tempId → { posX, posY }
   */
  computeLayout(nodes: FlatNode[]): Map<string, { posX: number; posY: number }> {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', ranksep: 150, nodesep: 60 });
    g.setDefaultEdgeLabel(() => ({}));

    const axisNodes = nodes.filter((n) => n.nodeType === 'GROUP' || n.nodeType === 'MILESTONE');
    const leafNodes = nodes.filter((n) => n.nodeType === 'REQUIRED' || n.nodeType === 'OPTIONAL');

    // Group leaf nodes by their tempParentId
    const childrenMap = new Map<string, FlatNode[]>();
    for (const leaf of leafNodes) {
      if (leaf.tempParentId) {
        if (!childrenMap.has(leaf.tempParentId)) {
          childrenMap.set(leaf.tempParentId, []);
        }
        childrenMap.get(leaf.tempParentId)!.push(leaf);
      }
    }

    const Y_SPACING = 50;
    const X_OFFSET = 340;
    const NODE_WIDTH = 260;
    const NODE_HEIGHT = 45;

    // 1. Layout axis nodes using Dagre
    let prevNode: FlatNode | null = null;
    for (const node of axisNodes) {
      g.setNode(node.tempId, {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });

      // Chain axis nodes sequentially to form a vertical central axis
      if (prevNode) {
        g.setEdge(prevNode.tempId, node.tempId);
      }
      prevNode = node;
    }

    dagre.layout(g);

    const result = new Map<string, { posX: number; posY: number }>();

    // 2. Merge axis node coordinates
    for (const node of axisNodes) {
      const dagreNode = g.node(node.tempId);
      if (!dagreNode) {
        continue;
      }

      const { x, y } = dagreNode;
      result.set(node.tempId, { posX: x, posY: y });

      // 3. Calculate manual positions for children
      const children = childrenMap.get(node.tempId) || [];
      const rightChildren = children.filter((_, idx) => idx % 2 === 0);
      const leftChildren = children.filter((_, idx) => idx % 2 !== 0);

      const placeChildren = (childArray: FlatNode[], isLeft: boolean) => {
        const k = childArray.length;
        if (k === 0) return;

        // Center children vertically around the parent's `y`
        const startY = y - ((k - 1) * Y_SPACING) / 2;
        childArray.forEach((child, idx) => {
          const cx = isLeft ? x - X_OFFSET : x + X_OFFSET;
          const cy = startY + idx * Y_SPACING;
          result.set(child.tempId, { posX: cx, posY: cy });
        });
      };

      placeChildren(rightChildren, false);
      placeChildren(leftChildren, true);
    }

    // Safety fallback: any leaf without a parent in axisNodes gets origin coordinates
    for (const leaf of leafNodes) {
      if (!result.has(leaf.tempId)) {
        result.set(leaf.tempId, { posX: 0, posY: 0 });
      }
    }

    return result;
  }
}
