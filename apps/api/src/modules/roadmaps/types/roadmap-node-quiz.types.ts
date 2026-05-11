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
