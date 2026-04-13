import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PERSONALIZED_QUESTIONS } from '../_data/template-conversation';
import {
  type ChatConversationItem,
  ConversationRole,
  type UsePersonalizedQuestionsChatParams,
} from '../_types/personalized-questions-chat.types';

export function usePersonalizedQuestionsChat({
  isLoading,
  onCompletedChange,
}: UsePersonalizedQuestionsChatParams) {
  const [messages, setMessages] = useState<ChatConversationItem[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAwaitingAnswer, setIsAwaitingAnswer] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const nextQuestionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastMessageIndex = messages.length - 1;
  const hasInitializedConversation = useMemo(() => messages.length > 0, [messages.length]);

  const clearNextQuestionTimer = useCallback(() => {
    if (!nextQuestionTimerRef.current) {
      return;
    }

    clearTimeout(nextQuestionTimerRef.current);
    nextQuestionTimerRef.current = null;
  }, []);

  const queueNextQuestion = useCallback((nextIndex: number) => {
    setIsThinking(true);

    nextQuestionTimerRef.current = setTimeout(() => {
      const nextQuestion = PERSONALIZED_QUESTIONS[nextIndex];

      if (!nextQuestion) {
        setIsThinking(false);
        setIsAwaitingAnswer(false);
        setIsCompleted(true);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${nextIndex}`,
          role: ConversationRole.AI,
          content: nextQuestion.content,
          options: nextQuestion.options,
        },
      ]);
      setIsThinking(false);
      setIsAwaitingAnswer(true);
    }, 500);
  }, []);

  const handleAnswerSubmit = useCallback(
    (value: string) => {
      const answer = value.trim();

      if (!answer || !isAwaitingAnswer || isThinking || isCompleted) {
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: ConversationRole.USER,
          content: answer,
        },
      ]);
      setCurrentAnswer('');
      setIsAwaitingAnswer(false);

      const nextQuestionIndex = currentQuestionIndex + 1;

      if (nextQuestionIndex >= PERSONALIZED_QUESTIONS.length) {
        setIsCompleted(true);
        return;
      }

      setCurrentQuestionIndex(nextQuestionIndex);
      queueNextQuestion(nextQuestionIndex);
    },
    [currentQuestionIndex, isAwaitingAnswer, isCompleted, isThinking, queueNextQuestion],
  );

  useEffect(() => {
    if (isLoading) {
      clearNextQuestionTimer();
      setMessages([]);
      setCurrentAnswer('');
      setCurrentQuestionIndex(0);
      setIsAwaitingAnswer(false);
      setIsThinking(false);
      setIsCompleted(false);
      return;
    }

    if (hasInitializedConversation) {
      return;
    }

    clearNextQuestionTimer();
    setCurrentAnswer('');
    setCurrentQuestionIndex(0);
    setIsAwaitingAnswer(true);
    setIsThinking(false);
    setIsCompleted(false);

    const firstQuestion = PERSONALIZED_QUESTIONS[0];

    if (!firstQuestion) {
      setMessages([]);
      setIsAwaitingAnswer(false);
      setIsCompleted(true);
      return;
    }

    setMessages([
      {
        id: 'ai-0',
        role: ConversationRole.AI,
        content: firstQuestion.content,
        options: firstQuestion.options,
      },
    ]);
  }, [clearNextQuestionTimer, hasInitializedConversation, isLoading]);

  useEffect(() => {
    onCompletedChange?.(isCompleted);
  }, [isCompleted, onCompletedChange]);

  useEffect(() => {
    return () => {
      clearNextQuestionTimer();
    };
  }, [clearNextQuestionTimer]);

  return {
    currentAnswer,
    handleAnswerSubmit,
    isAwaitingAnswer,
    isCompleted,
    isThinking,
    lastMessageIndex,
    messages,
    setCurrentAnswer,
  };
}
