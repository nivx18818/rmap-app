/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import * as dagre from '@dagrejs/dagre';
import { Injectable } from '@nestjs/common';

import type { FlatNode } from './types/ai-roadmap.types';

/**
 * Computes a top-to-bottom Dagre layout for a flat list of roadmap nodes.
 *
 * Coordinates are calculated ONCE during generation and persisted to
 * roadmap_nodes.pos_x / pos_y — never recalculated client-side (FR-07).
 */
@Injectable()
export class DagreLayoutService {
  /**
   * @param nodes Flat node list with tempId / tempParentId assigned.
   * @returns Map of tempId → { posX, posY }
   */
  computeLayout(nodes: FlatNode[]): Map<string, { posX: number; posY: number }> {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', ranksep: 100, nodesep: 60 });
    g.setDefaultEdgeLabel(() => ({}));

    for (const node of nodes) {
      const isLeaf = node.nodeType === 'REQUIRED' || node.nodeType === 'OPTIONAL';
      g.setNode(node.tempId, {
        width: isLeaf ? 200 : 300,
        height: isLeaf ? 60 : 80,
      });

      if (node.tempParentId) {
        g.setEdge(node.tempParentId, node.tempId);
      }
    }

    dagre.layout(g);

    const result = new Map<string, { posX: number; posY: number }>();
    for (const node of nodes) {
      const { x, y } = g.node(node.tempId);
      result.set(node.tempId, { posX: x, posY: y });
    }

    return result;
  }
}
