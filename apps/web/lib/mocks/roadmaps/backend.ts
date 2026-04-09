import type { NodeProgress, RoadmapProgress, RoadmapWithNodes } from '@/types/roadmap';

import { FRONTEND_ROADMAP } from '@/lib/data/roadmaps/frontend';

const IN_PROGRESS_NODE_IDS = new Set<string>([
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004',
]);

const COMPLETED_NODE_IDS = new Set<string>([
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
]);

function createNodeProgress(roadmap: RoadmapWithNodes): NodeProgress[] {
  return roadmap.nodes.map((node) => {
    const isCompleted = COMPLETED_NODE_IDS.has(node.id);
    const isInProgress = IN_PROGRESS_NODE_IDS.has(node.id);

    return {
      completed_at: isCompleted ? '2026-04-08T15:30:00Z' : null,
      roadmap_node_id: node.id,
      skill_id: node.skill_id,
      skill_name: node.skill_name,
      started_at: isCompleted || isInProgress ? '2026-04-07T09:00:00Z' : null,
      status: isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'locked',
    };
  });
}

const progressNodes = createNodeProgress(FRONTEND_ROADMAP);

export const mockRoadmapResponse: RoadmapWithNodes = FRONTEND_ROADMAP;

export const mockGenerateRoadmapResponse = {
  generation_summary: {
    feasibility_ok: true,
    total_estimated_hours: FRONTEND_ROADMAP.nodes.reduce(
      (total, node) => total + (node.skill_estimated_hours ?? 0),
      0,
    ),
    total_skills: FRONTEND_ROADMAP.nodes.length,
  },
  roadmap: FRONTEND_ROADMAP,
};

export const mockRoadmapNodesResponse = {
  data: FRONTEND_ROADMAP.nodes,
};

export const mockRoadmapProgressResponse: RoadmapProgress = {
  completed_nodes: progressNodes.filter((node) => node.status === 'completed').length,
  completion_percentage: Number(
    (
      (progressNodes.filter((node) => node.status === 'completed').length /
        FRONTEND_ROADMAP.nodes.length) *
      100
    ).toFixed(1),
  ),
  in_progress_nodes: progressNodes.filter((node) => node.status === 'in_progress').length,
  nodes: progressNodes,
  roadmap_id: FRONTEND_ROADMAP.id,
  total_nodes: FRONTEND_ROADMAP.nodes.length,
};

export const mockSavedRoadmapsResponse = {
  data: [FRONTEND_ROADMAP],
  meta: {
    page: 1,
    per_page: 20,
    total: 1,
    total_pages: 1,
  },
};

const ROADMAP_MOCKS_BY_SLUG = {
  frontend: mockRoadmapResponse,
} as const;

export function getMockRoadmapBySlug(slug: string) {
  return ROADMAP_MOCKS_BY_SLUG[slug as keyof typeof ROADMAP_MOCKS_BY_SLUG] ?? null;
}
