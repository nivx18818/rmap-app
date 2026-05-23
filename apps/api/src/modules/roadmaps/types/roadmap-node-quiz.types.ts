import type { UserNodeProgressResponse } from './roadmap-nodes.types';

export interface QuizQuestionPublic {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

export interface RoadmapNodeQuizResponse {
  nodeId: string;
  skillId: string;
  questions: QuizQuestionPublic[];
}

export type QuizOption = 'a' | 'b' | 'c' | 'd';

export interface SubmitQuizQuestionResult {
  questionId: string;
  selectedOption: QuizOption;
  correctOption: QuizOption;
  isCorrect: boolean;
}

export interface SubmitQuizResponse {
  scorePct: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  results: SubmitQuizQuestionResult[];
  nodeProgress: UserNodeProgressResponse;
  unlockedNodes: string[];
  suggestion: string | null;
}
