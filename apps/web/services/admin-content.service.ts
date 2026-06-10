import axios from 'axios';

import type {
  AdminSkill,
  AdminSkillPayload,
  AdminSkillResource,
  AdminSkillResourcePayload,
  AdminSkillResourcesResponse,
  AdminSkillsListResponse,
  AdminSkillsQuery,
  ApiErrorResponse,
} from '@/types/admin-content';

import { ENDPOINTS } from '@/constants/endpoints';
import { axiosInstance } from '@/lib/axios-instance';

export const adminContentService = {
  createResource: async (skillId: string, payload: AdminSkillResourcePayload) => {
    const response = await axiosInstance.post<AdminSkillResource>(
      ENDPOINTS.admin.skills.resources(skillId),
      payload,
    );
    return response.data;
  },
  createSkill: async (payload: AdminSkillPayload) => {
    const response = await axiosInstance.post<AdminSkill>(ENDPOINTS.admin.skills.list, payload);
    return response.data;
  },
  deleteResource: async (skillId: string, resourceId: number) => {
    await axiosInstance.delete<void>(ENDPOINTS.admin.skills.resourceById(skillId, resourceId));
  },
  deleteSkill: async (skillId: string) => {
    await axiosInstance.delete<void>(ENDPOINTS.admin.skills.byId(skillId));
  },
  listResources: async (skillId: string) => {
    const response = await axiosInstance.get<AdminSkillResourcesResponse>(
      ENDPOINTS.admin.skills.resources(skillId),
    );
    return response.data;
  },
  listSkills: async (query: AdminSkillsQuery) => {
    const response = await axiosInstance.get<AdminSkillsListResponse>(ENDPOINTS.admin.skills.list, {
      params: query,
    });
    return response.data;
  },
  updateResource: async (
    skillId: string,
    resourceId: number,
    payload: AdminSkillResourcePayload,
  ) => {
    const response = await axiosInstance.put<AdminSkillResource>(
      ENDPOINTS.admin.skills.resourceById(skillId, resourceId),
      payload,
    );
    return response.data;
  },
  updateSkill: async (skillId: string, payload: Partial<AdminSkillPayload>) => {
    const response = await axiosInstance.put<AdminSkill>(
      ENDPOINTS.admin.skills.byId(skillId),
      payload,
    );
    return response.data;
  },
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallback;
  }

  return error.response?.data?.message ?? fallback;
}
