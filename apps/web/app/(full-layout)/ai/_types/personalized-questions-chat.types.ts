export interface QuestionItem {
  content: string;
  options: string[];
}

export enum ConversationRole {
  USER,
  AI,
}

export interface ChatConversationItem {
  id: string;
  role: ConversationRole;
  content: string;
  options?: string[];
}

export interface UsePersonalizedQuestionsChatParams {
  isLoading: boolean;
  onCompletedChange?: (isCompleted: boolean) => void;
}
