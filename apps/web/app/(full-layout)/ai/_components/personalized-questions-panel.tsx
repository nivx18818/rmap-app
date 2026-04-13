'use client';

import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useEffect, useRef } from 'react';

import { usePersonalizedQuestionsChat } from '@/app/(full-layout)/ai/_hooks/use-personalized-questions-chat';
import { ChatInput, ChatLoading, ChatMessage } from '@/components/shared/chat-message';
import { LoadingState } from '@/components/shared/loading-state';

interface PersonalizedQuestionsPanelProps {
  isLoading: boolean;
  onCompletedChange?: (isCompleted: boolean) => void;
}

export function PersonalizedQuestionsPanel({
  isLoading,
  onCompletedChange,
}: PersonalizedQuestionsPanelProps) {
  const {
    messages,
    currentAnswer,
    setCurrentAnswer,
    handleAnswerSubmit,
    isAwaitingAnswer,
    isThinking,
    isCompleted,
    lastMessageIndex,
  } = usePersonalizedQuestionsChat({
    isLoading,
    onCompletedChange,
  });

  const messageListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = messageListRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking, isCompleted]);

  return (
    <div className="border-border relative flex h-fit max-h-120 w-full flex-col items-center justify-center overflow-hidden rounded-xl border p-3 shadow-[inset_0_1px_3px_rgba(139,92,246,0.08)] backdrop-blur-xs transition-all sm:max-h-136 sm:p-4">
      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          <div
            ref={messageListRef}
            className="scrollbar-thin flex w-full flex-1 flex-col gap-5 overflow-y-auto pr-1.5 pb-3 sm:gap-6 sm:pr-2 sm:pb-4"
          >
            {messages.map((message, index) => {
              const shouldEnableOptions =
                message.role === ConversationRole.AI &&
                index === lastMessageIndex &&
                !isThinking &&
                isAwaitingAnswer &&
                !isCompleted;

              return (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  options={message.options}
                  isOptionDisabled={!shouldEnableOptions}
                  onOptionSelect={handleAnswerSubmit}
                />
              );
            })}

            {isThinking && !isCompleted && <ChatLoading />}

            {isCompleted && (
              <div className="bg-background-secondary/60 border-border/80 flex items-center gap-2 rounded-md border px-3 py-2 text-sm sm:text-base">
                <HugeiconsIcon
                  className="text-primary size-4 sm:size-5"
                  icon={CheckmarkCircle02Icon}
                />
                Personalized questions completed. You can now generate your roadmap.
              </div>
            )}
          </div>

          {!isCompleted && (
            <ChatInput
              disabled={isThinking || !isAwaitingAnswer}
              value={currentAnswer}
              onValueChange={setCurrentAnswer}
              onSubmit={() => {
                handleAnswerSubmit(currentAnswer);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
