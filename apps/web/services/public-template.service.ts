import type { RoadmapDetail } from '@/app/(full-layout)/roadmaps/[id]/_types/roadmap-detail.types';
import type {
  RoadmapNode,
  RoadmapNodesResponse,
} from '@/app/(full-layout)/roadmaps/[id]/_types/roadmap-node.types';

import { ENDPOINTS } from '@/constants/endpoints';
import { axiosInstance } from '@/lib/axios-instance';

type TemplateRoadmapNode = Omit<RoadmapNode, 'createdAt' | 'progress'>;

interface TemplateRoadmapNodesResponse {
  nodes: TemplateRoadmapNode[];
}

function mapTemplateNode(node: TemplateRoadmapNode): RoadmapNode {
  return {
    ...node,
    progress: null,
  };
}

export const publicTemplateService = {
  getById: async (templateId: string) => {
    const response = await axiosInstance.get<RoadmapDetail>(
      ENDPOINTS.templates.getById(templateId),
      {
        skipAuthRedirect: true,
      },
    );

    return response.data;
  },

  getNodes: async (templateId: string): Promise<RoadmapNodesResponse> => {
    const response = await axiosInstance.get<TemplateRoadmapNodesResponse>(
      ENDPOINTS.templates.nodes(templateId),
      { skipAuthRedirect: true },
    );

    return {
      nodes: response.data.nodes.map(mapTemplateNode),
    };
  },
};
