import {
  type GoalSuggestion,
  type OnboardingQuizResult,
} from '@/app/(full-layout)/roadmaps/generate/_types/onboarding';
import { ENDPOINTS } from '@/constants/endpoints';
import { axiosInstance } from '@/lib/axios-instance';

export const onboardingService = {
  getGoals: async (roleCategory?: string) => {
    const response = await axiosInstance.get<{ suggestions: GoalSuggestion[] }>(
      ENDPOINTS.onboarding.goals,
      { params: { roleCategory } },
    );
    return response.data;
  },

  getQuiz: async (topic: string) => {
    const response = await axiosInstance.post<OnboardingQuizResult>(
      ENDPOINTS.onboarding.quiz,
      { topic },
      { timeout: 30000 },
    );
    return response.data;
  },
};
