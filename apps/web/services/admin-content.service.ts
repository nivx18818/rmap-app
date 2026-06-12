import axios from 'axios';

import type {
  AdminSkill,
  AdminSkillPayload,
  AdminSkillResource,
  AdminSkillResourcePayload,
  AdminSkillResourcesResponse,
  AdminSkillsListResponse,
  AdminSkillsQuery,
  AdminDashboardResponse,
  AdminTemplate,
  AdminTemplateNode,
  AdminTemplateNodePayload,
  AdminTemplateNodesResponse,
  AdminTemplatePayload,
  AdminTemplatesListResponse,
  AdminTemplatesQuery,
  ApiErrorResponse,
} from '@/types/admin-content';

import { ENDPOINTS } from '@/constants/endpoints';
import { axiosInstance } from '@/lib/axios-instance';

export const adminContentService = {
  getDashboard: async () => {
    const response = await axiosInstance.get<AdminDashboardResponse>(ENDPOINTS.admin.dashboard);
    return response.data;
  },
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
  createTemplate: async (payload: AdminTemplatePayload) => {
    const response = await axiosInstance.post<AdminTemplate>(
      ENDPOINTS.admin.templates.list,
      payload,
    );
    return response.data;
  },
  createTemplateNode: async (templateId: string, payload: AdminTemplateNodePayload) => {
    const response = await axiosInstance.post<AdminTemplateNode>(
      ENDPOINTS.admin.templates.nodes(templateId),
      payload,
    );
    return response.data;
  },
  deleteResource: async (skillId: string, resourceId: number) => {
    await axiosInstance.delete<void>(ENDPOINTS.admin.skills.resourceById(skillId, resourceId));
  },
  deleteSkill: async (skillId: string) => {
    await axiosInstance.delete<void>(ENDPOINTS.admin.skills.byId(skillId));
  },
  deleteTemplate: async (templateId: string) => {
    await axiosInstance.delete<void>(ENDPOINTS.admin.templates.byId(templateId));
  },
  deleteTemplateNode: async (templateId: string, nodeId: string) => {
    await axiosInstance.delete<void>(ENDPOINTS.admin.templates.nodeById(templateId, nodeId));
  },
  getTemplate: async (templateId: string) => {
    const response = await axiosInstance.get<AdminTemplate>(
      ENDPOINTS.admin.templates.byId(templateId),
    );
    return response.data;
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
  listTemplates: async (query: AdminTemplatesQuery) => {
    const response = await axiosInstance.get<AdminTemplatesListResponse>(
      ENDPOINTS.admin.templates.list,
      {
        params: query,
      },
    );
    return response.data;
  },
  listTemplateNodes: async (templateId: string) => {
    const response = await axiosInstance.get<AdminTemplateNodesResponse>(
      ENDPOINTS.admin.templates.nodes(templateId),
    );
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
  updateTemplate: async (templateId: string, payload: AdminTemplatePayload) => {
    const response = await axiosInstance.put<AdminTemplate>(
      ENDPOINTS.admin.templates.byId(templateId),
      payload,
    );
    return response.data;
  },
  updateTemplateNode: async (
    templateId: string,
    nodeId: string,
    payload: AdminTemplateNodePayload,
  ) => {
    const response = await axiosInstance.put<AdminTemplateNode>(
      ENDPOINTS.admin.templates.nodeById(templateId, nodeId),
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
