import type {
  RoadmapNodesFilter,
  RoadmapNodesResponse,
} from '@/app/(full-layout)/roadmaps/[id]/_types/roadmap-node.types';
import type {
  GenerateRoadmapPayload,
  GenerateRoadmapResponse,
} from '@/app/(full-layout)/roadmaps/generate/_types/onboarding';

import { ENDPOINTS } from '@/constants/endpoints';
import { axiosInstance } from '@/lib/axios-instance';

export const roadmapService = {
  generate: async (payload: GenerateRoadmapPayload) => {
    const response = await axiosInstance.post<GenerateRoadmapResponse>(
      ENDPOINTS.roadmaps.generate,
      payload,
      { timeout: 180000 },
    );
    return response.data;
  },

  getRoadmapNodes: async (roadmapId: string, filters: RoadmapNodesFilter = {}) => {
    const params = new URLSearchParams();
    if (filters.nodeType) params.set('nodeType', filters.nodeType);
    if (filters.status) params.set('status', filters.status);
    if (filters.q) params.set('q', filters.q);

    const response = await axiosInstance.get<RoadmapNodesResponse>(
      ENDPOINTS.roadmaps.nodes(roadmapId),
      { params },
    );
    return response.data;
  },
};
