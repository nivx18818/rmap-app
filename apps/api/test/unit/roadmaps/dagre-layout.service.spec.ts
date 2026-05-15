import type { FlatNode } from '@/modules/roadmaps/types/ai-roadmap.types';

import { DagreLayoutService } from '@/modules/roadmaps/dagre-layout.service';

import { MOCK_FLAT_NODES } from '../../utils/roadmaps.mock';

describe('DagreLayoutService', () => {
  let service: DagreLayoutService;

  beforeEach(() => {
    service = new DagreLayoutService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('computeLayout', () => {
    it('should return a Map entry for every input node', () => {
      const result = service.computeLayout(MOCK_FLAT_NODES);

      expect(result.size).toBe(MOCK_FLAT_NODES.length);
      for (const node of MOCK_FLAT_NODES) {
        expect(result.has(node.tempId)).toBe(true);
      }
    });

    it('should assign numeric posX and posY to every node', () => {
      const result = service.computeLayout(MOCK_FLAT_NODES);

      for (const [, pos] of result) {
        expect(typeof pos.posX).toBe('number');
        expect(typeof pos.posY).toBe('number');
        expect(isNaN(pos.posX)).toBe(false);
        expect(isNaN(pos.posY)).toBe(false);
      }
    });

    it('should place children alternately on left and right, aligned vertically with their parent', () => {
      const result = service.computeLayout(MOCK_FLAT_NODES);

      const groupPos = result.get('t0')!;
      const child1Pos = result.get('t1')!; // right child
      const child2Pos = result.get('t2')!; // left child

      // X coordinates should be offset to the left and right
      expect(child1Pos.posX).toBeGreaterThan(groupPos.posX); // Right
      expect(child2Pos.posX).toBeLessThan(groupPos.posX); // Left

      // Y coordinates should be defined and numeric
      expect(typeof child1Pos.posY).toBe('number');
      expect(typeof child2Pos.posY).toBe('number');
    });

    it('should assign coordinates to milestone nodes (no children)', () => {
      const result = service.computeLayout(MOCK_FLAT_NODES);

      const milestonePos = result.get('t8'); // Milestone is t8 in MOCK_FLAT_NODES
      expect(milestonePos).toBeDefined();
      expect(typeof milestonePos!.posX).toBe('number');
      expect(typeof milestonePos!.posY).toBe('number');
    });

    it('should handle a single-node input without throwing', () => {
      const singleNode: FlatNode[] = [
        {
          tempId: 't0',
          tempParentId: null,
          realId: 'r0',
          realParentId: null,
          name: 'Solo',
          nodeType: 'GROUP',
          description: null,
          estimatedHours: null,
          skillId: null,
        },
      ];

      const result = service.computeLayout(singleNode);
      expect(result.size).toBe(1);
    });
  });
});
