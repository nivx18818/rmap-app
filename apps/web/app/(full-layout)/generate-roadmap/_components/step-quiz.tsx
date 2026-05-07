'use client';

import { ArrowLeft02FreeIcons, ArrowRight, FlaskConical } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { Button } from '@repo/design-system/components/ui/button';
import { useEffect, useRef, useState } from 'react';

import type {
  OnboardingQuizResult,
  QuizQuestion,
} from '@/app/(full-layout)/generate-roadmap/_types/onboarding';

import { LoadingState } from '@/components/shared/loading-state';
import { onboardingService } from '@/services/onboarding-service';

import { PersonalizedQuestionsPanel } from './personalized-questions-panel';

interface StepQuizProps {
  goal: string;
  initialAnswers: Record<string, string>;
  onAnswersChange: (answers: Record<string, string>) => void;
  onRoleCategoryLoaded: (category: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isGenerating: boolean;
}

export function StepQuiz({
  goal,
  initialAnswers,
  onAnswersChange,
  onRoleCategoryLoaded,
  onSubmit,
  onBack,
  isGenerating,
}: StepQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // We consider it valid if answers count matches questions count
  const allAnswered =
    questions.length > 0 && Object.keys(initialAnswers).length === questions.length;

  const activeFetch = useRef<{ goal: string; promise: Promise<OnboardingQuizResult> } | null>(null);

  useEffect(() => {
    let mounted = true;

    if (activeFetch.current?.goal !== goal) {
      activeFetch.current = {
        goal,
        promise: onboardingService.getQuiz(goal),
      };
    }

    setIsLoading(true);

    activeFetch.current.promise
      .then((data) => {
        if (mounted) {
          setQuestions(data.questions);
          onRoleCategoryLoaded(data.roleCategory);
        }
      })
      .catch((error) => {
        if (mounted) {
          console.error('Failed to fetch quiz', error);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [goal, onRoleCategoryLoaded]);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PersonalizedQuestionsPanel questions={questions} onAnswersChange={onAnswersChange} />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          type="button"
          disabled={isGenerating}
          onClick={onBack}
        >
          <HugeiconsIcon icon={ArrowLeft02FreeIcons} />
          Go back
        </Button>

        <Button
          size="lg"
          className="group/btn w-full"
          type="button"
          disabled={!allAnswered || isGenerating}
          onClick={onSubmit}
        >
          {isGenerating ? 'Generating...' : 'Generate roadmap'}
          <AnimatedIconSwap icon={ArrowRight} hoverIcon={FlaskConical} />
        </Button>
      </div>
    </div>
  );
}
