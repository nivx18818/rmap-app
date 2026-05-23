import type { RoadmapDetail } from '@/app/(full-layout)/roadmaps/[id]/_types/roadmap-detail.types';
import type {
  RoadmapNodeDetail,
  RoadmapNodeDetailApiResponse,
  UpdateRoadmapNodeProgressResponse,
} from '@/app/(full-layout)/roadmaps/[id]/_types/roadmap-node-detail.types';
import type {
  RoadmapNodeQuiz,
  RoadmapNodeQuizAnswers,
  RoadmapNodeQuizApiQuestion,
  RoadmapNodeQuizApiResponse,
  SubmitRoadmapNodeQuizPayload,
  SubmitRoadmapNodeQuizResult,
} from '@/app/(full-layout)/roadmaps/[id]/_types/roadmap-node-quiz.types';
import type {
  ProgressStatus,
  RoadmapNodesFilter,
  RoadmapNodesResponse,
} from '@/app/(full-layout)/roadmaps/[id]/_types/roadmap-node.types';
import type {
  GenerateRoadmapPayload,
  GenerateRoadmapResponse,
} from '@/app/(full-layout)/roadmaps/generate/_types/onboarding';

import { ENDPOINTS } from '@/constants/endpoints';
import { axiosInstance } from '@/lib/axios-instance';

const QUIZ_OPTIONS = [
  { key: 'optionA', label: 'A', value: 'a' },
  { key: 'optionB', label: 'B', value: 'b' },
  { key: 'optionC', label: 'C', value: 'c' },
  { key: 'optionD', label: 'D', value: 'd' },
] as const;

function mapNodeDetailResponse(response: RoadmapNodeDetailApiResponse): RoadmapNodeDetail {
  return {
    description: response.node.description,
    estimatedHours: response.node.estimatedHours,
    id: response.node.id,
    name: response.node.name,
    nodeType: response.node.nodeType,
    prerequisites: response.prerequisites.map((prerequisite) => ({
      id: prerequisite.skillId,
      name: prerequisite.skillName,
    })),
    progress: response.node.progress,
    projectBrief:
      response.node.nodeType === 'MILESTONE' ? (response.node.description ?? undefined) : undefined,
    resources: response.resources ?? [],
    skillDescription: response.skill?.description ?? undefined,
  };
}

function mapQuizQuestion(question: RoadmapNodeQuizApiQuestion) {
  return {
    id: question.id,
    options: QUIZ_OPTIONS.map((option) => ({
      label: option.label,
      text: question[option.key],
      value: option.value,
    })),
    questionText: question.questionText,
  };
}

function mapQuizAnswers(answers: RoadmapNodeQuizAnswers): SubmitRoadmapNodeQuizPayload {
  return {
    answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption: selectedOption.toUpperCase() as Uppercase<typeof selectedOption>,
    })),
  };
}

export const roadmapService = {
  generate: async (payload: GenerateRoadmapPayload) => {
    const response = await axiosInstance.post<GenerateRoadmapResponse>(
      ENDPOINTS.roadmaps.generate,
      payload,
      { timeout: 180000 },
    );
    return response.data;
  },

  getById: async (roadmapId: string) => {
    const response = await axiosInstance.get<RoadmapDetail>(ENDPOINTS.roadmaps.getById(roadmapId));
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

  getNodeDetail: async (roadmapId: string, nodeId: string) => {
    const response = await axiosInstance.get<RoadmapNodeDetailApiResponse>(
      ENDPOINTS.roadmaps.nodeDetail(roadmapId, nodeId),
    );
    return mapNodeDetailResponse(response.data);
  },

  getNodeQuiz: async (roadmapId: string, nodeId: string): Promise<RoadmapNodeQuiz> => {
    const response = await axiosInstance.get<RoadmapNodeQuizApiResponse>(
      ENDPOINTS.roadmaps.nodeQuiz(roadmapId, nodeId),
      { timeout: 60000 },
    );
    return {
      nodeId: response.data.nodeId,
      questions: response.data.questions.map(mapQuizQuestion),
      skillId: response.data.skillId,
    };
  },

  submitNodeQuiz: async (roadmapId: string, nodeId: string, answers: RoadmapNodeQuizAnswers) => {
    const response = await axiosInstance.post<SubmitRoadmapNodeQuizResult>(
      ENDPOINTS.roadmaps.submitNodeQuiz(roadmapId, nodeId),
      mapQuizAnswers(answers),
    );
    return response.data;
  },

  updateNodeProgress: async (roadmapId: string, nodeId: string, status: ProgressStatus) => {
    const response = await axiosInstance.patch<UpdateRoadmapNodeProgressResponse>(
      ENDPOINTS.roadmaps.nodeProgress(roadmapId, nodeId),
      { status },
    );
    return response.data;
  },
};
