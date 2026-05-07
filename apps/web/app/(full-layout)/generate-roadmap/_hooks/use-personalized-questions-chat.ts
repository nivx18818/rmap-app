import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { QuizQuestion } from '@/app/(full-layout)/generate-roadmap/_types/onboarding';

import {
  type ChatConversationItem,
  ConversationRole,
} from '../_types/personalized-questions-chat.types';

interface UsePersonalizedQuestionsChatParams {
  questions: QuizQuestion[];
  onAnswersChange?: (answers: Record<string, string>) => void;
}

export function usePersonalizedQuestionsChat({
  questions,
  onAnswersChange,
}: UsePersonalizedQuestionsChatParams) {
  const [messages, setMessages] = useState<ChatConversationItem[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAwaitingAnswer, setIsAwaitingAnswer] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
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

  const queueNextQuestion = useCallback(
    (nextIndex: number) => {
      setIsThinking(true);

      nextQuestionTimerRef.current = setTimeout(() => {
        const nextQuestion = questions[nextIndex];

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
            content: nextQuestion.question,
            options: nextQuestion.possibleAnswers,
          },
        ]);
        setIsThinking(false);
        setIsAwaitingAnswer(true);
      }, 500);
    },
    [questions],
  );

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

      const currentQ = questions[currentQuestionIndex]?.question;
      if (currentQ) {
        const newAnswers = { ...answers, [currentQ]: answer };
        setAnswers(newAnswers);
        onAnswersChange?.(newAnswers);
      }

      setCurrentAnswer('');
      setIsAwaitingAnswer(false);

      const nextQuestionIndex = currentQuestionIndex + 1;

      if (nextQuestionIndex >= questions.length) {
        setIsCompleted(true);
        return;
      }

      setCurrentQuestionIndex(nextQuestionIndex);
      queueNextQuestion(nextQuestionIndex);
    },
    [
      answers,
      currentQuestionIndex,
      isAwaitingAnswer,
      isCompleted,
      isThinking,
      questions,
      queueNextQuestion,
      onAnswersChange,
    ],
  );

  useEffect(() => {
    if (!questions || questions.length === 0) {
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
    setAnswers({});

    const firstQuestion = questions[0];

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
        content: firstQuestion.question,
        options: firstQuestion.possibleAnswers,
      },
    ]);
  }, [clearNextQuestionTimer, hasInitializedConversation, questions]);

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
    answers,
  };
}
