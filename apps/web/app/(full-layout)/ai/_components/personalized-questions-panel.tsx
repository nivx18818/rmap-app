'use client';

import { ChatInput, ChatLoading, ChatMessage } from '@/components/shared/chat-message';
import { LoadingState } from '@/components/shared/loading-state';

interface PersonalizedQuestionsPanelProps {
  isLoading: boolean;
}

export function PersonalizedQuestionsPanel({ isLoading }: PersonalizedQuestionsPanelProps) {
  return (
    <div className="border-border relative flex h-fit max-h-120 w-full flex-col items-center justify-center overflow-hidden rounded-xl border p-3 shadow-[inset_0_1px_3px_rgba(139,92,246,0.08)] backdrop-blur-xs transition-all sm:max-h-136 sm:p-4">
      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          <div className="scrollbar-thin flex w-full flex-1 flex-col gap-5 overflow-y-auto pr-1.5 pb-3 sm:gap-6 sm:pr-2 sm:pb-4">
            <ChatMessage
              role="ai"
              content="What is your primary goal for learning prompt engineering?"
            />
            <ChatMessage role="user" content="Automating tasks or workflows" />
            <ChatMessage
              role="ai"
              content="Which AI models or platforms are you most interested in mastering?"
              options={['Open AI', 'Claude AI', 'Google Gemini', 'Meta Llama', 'Other']}
            />
            <ChatLoading />
          </div>

          <ChatInput />
        </>
      )}
    </div>
  );
}
