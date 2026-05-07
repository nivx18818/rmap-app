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
      { timeout: 60000 },
    );
    return response.data;
  },
};
