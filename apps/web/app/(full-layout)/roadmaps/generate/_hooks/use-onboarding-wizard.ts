import type { Route } from 'next';

import { toast } from '@repo/design-system/lib/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { type TimelineWarning } from '@/app/(full-layout)/roadmaps/generate/_types/onboarding';
import { roadmapService } from '@/services/roadmap.service';
import { buildRoadmapHref } from '@/utils/roadmap-url';

export type WizardStep = 1 | 2 | 'loading' | 'success' | 'error';

export const DEFAULT_HOURS_PER_DAY = 2;

export function useOnboardingWizard() {
  const router = useRouter();

  const [step, setStep] = useState<WizardStep>(1);
  const [stepOneData, setStepOneData] = useState<{
    goal: string;
    hours_per_day: number;
    deadline_date: string;
  }>({
    goal: '',
    hours_per_day: DEFAULT_HOURS_PER_DAY,
    deadline_date: '',
  });
  const [roleCategory, setRoleCategory] = useState<string>('');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(false);
  const [timelineWarning, setTimelineWarning] = useState<TimelineWarning | undefined>();
  const [generatedRoadmapId, setGeneratedRoadmapId] = useState<string | undefined>();
  const [generatedRoadmapTitle, setGeneratedRoadmapTitle] = useState<string | undefined>();

  const nextStep = useCallback(() => {
    setStep((prev) => (prev === 1 ? 2 : prev));
  }, []);

  const prevStep = useCallback(() => {
    setStep((prev) => (prev === 2 ? 1 : prev));
  }, []);

  const resetToStart = useCallback(() => {
    setStep(1);
    setGenerationError(false);
    setTimelineWarning(undefined);
    setGeneratedRoadmapId(undefined);
    setGeneratedRoadmapTitle(undefined);
  }, []);

  const submitGenerate = useCallback(async () => {
    setStep('loading');
    setIsGenerating(true);
    setGenerationError(false);
    setTimelineWarning(undefined);
    setGeneratedRoadmapId(undefined);
    setGeneratedRoadmapTitle(undefined);

    try {
      const formattedQuizAnswers = Object.entries(quizAnswers).map(([question, answer]) => ({
        question,
        answer,
      }));

      const result = await roadmapService.generate({
        goal: stepOneData.goal,
        roleCategory: roleCategory.toUpperCase().replace(/-/g, '_'),
        hoursPerDay: stepOneData.hours_per_day,
        deadlineDate: stepOneData.deadline_date,
        quizAnswers: formattedQuizAnswers,
      });

      const generatedTitle =
        typeof result.roadmap.title === 'string' && result.roadmap.title.trim()
          ? result.roadmap.title
          : stepOneData.goal;

      setGeneratedRoadmapId(result.roadmap.id);
      setGeneratedRoadmapTitle(generatedTitle);

      if (result.timelineWarning) {
        setTimelineWarning(result.timelineWarning);
        setStep('success');
        return;
      }

      toast.success('Roadmap Generated Successfully!', {
        description: `Topic: ${stepOneData.goal}`,
      });
      setStep('success');

      setTimeout(() => {
        router.push(
          buildRoadmapHref({ id: result.roadmap.id, title: generatedTitle }) as Route<string>,
        );
      }, 2000);
    } catch (error) {
      console.error('Failed to generate roadmap', error);
      setGenerationError(true);
      setStep('error');
    } finally {
      setIsGenerating(false);
    }
  }, [stepOneData, quizAnswers, roleCategory, router]);

  return {
    step,
    stepOneData,
    roleCategory,
    quizAnswers,
    setStepOneData,
    setRoleCategory,
    setQuizAnswers,
    nextStep,
    prevStep,
    submitGenerate,
    resetToStart,
    isGenerating,
    generationError,
    timelineWarning,
    generatedRoadmapId,
    generatedRoadmapTitle,
  };
}
