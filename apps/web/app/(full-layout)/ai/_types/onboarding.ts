export interface GoalSuggestion {
  label: string;
  roleCategory: string;
  description: string;
  estimatedWeeks: number;
}

export interface QuizQuestion {
  question: string;
  possibleAnswers: string[];
}

export interface OnboardingQuizResult {
  roleCategory: string;
  questions: QuizQuestion[];
}

export interface GenerateRoadmapPayload {
  goal: string;
  roleCategory: string;
  hoursPerDay: number;
  deadlineDate: string;
  quizAnswers: Array<{ question: string; answer: string }>;
}
export interface TimelineWarning {
  isBehind: boolean;
  paceDeficitPct: number;
  estimatedDelayDays: number;
  message: string;
}

export interface GenerateRoadmapResponse {
  roadmap: {
    id: string;
    [key: string]: unknown;
  };
  timelineWarning?: TimelineWarning;
}
