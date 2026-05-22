import type { NodeProgress } from './roadmap-node.types';

export type QuizOption = 'a' | 'b' | 'c' | 'd';
export type QuizOptionLabel = Uppercase<QuizOption>;

export interface RoadmapNodeQuizOption {
  label: string;
  text: string;
  value: QuizOption;
}

export interface RoadmapNodeQuizQuestion {
  id: string;
  options: RoadmapNodeQuizOption[];
  questionText: string;
}

export interface RoadmapNodeQuiz {
  nodeId: string;
  questions: RoadmapNodeQuizQuestion[];
  skillId: string;
}

export interface SubmitRoadmapNodeQuizResult {
  correctCount: number;
  nodeProgress: NodeProgress;
  passed: boolean;
  results: Array<{
    correctOption: QuizOption;
    isCorrect: boolean;
    questionId: string;
    selectedOption: QuizOption;
  }>;
  scorePct: number;
  suggestion: string | null;
  totalQuestions: number;
}

export type RoadmapNodeQuizAnswers = Record<string, QuizOption>;

export interface RoadmapNodeQuizApiQuestion {
  id: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  questionText: string;
}

export interface RoadmapNodeQuizApiResponse {
  nodeId: string;
  questions: RoadmapNodeQuizApiQuestion[];
  skillId: string;
}

export interface SubmitRoadmapNodeQuizPayload {
  answers: Array<{
    questionId: string;
    selectedOption: QuizOptionLabel;
  }>;
}
