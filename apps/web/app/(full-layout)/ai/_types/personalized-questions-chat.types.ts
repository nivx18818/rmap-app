export interface QuestionItem {
  content: string;
  options: string[];
}

export const ConversationRole = {
  AI: 'ai',
  USER: 'user',
} as const;

export type ConversationRole = (typeof ConversationRole)[keyof typeof ConversationRole];

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
