'use client';

import {
  ArrowLeft02FreeIcons,
  ArrowRight,
  ArrowRight02FreeIcons,
  FlaskConical,
  Loading03Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { Button } from '@repo/design-system/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@repo/design-system/components/ui/field';
import { Input } from '@repo/design-system/components/ui/input';
import { cn } from '@repo/design-system/lib/utils';

import { useAiRoadmapForm } from '@/app/(full-layout)/ai/_hooks/use-ai-roadmap-form';

import { PersonalizedQuestionsPanel } from './personalized-questions-panel';

export function AiRoadmapForm() {
  const {
    register,
    handleSubmit,
    onSubmit,
    onStartPersonalizedQuestions,
    isValid,
    isSubmitting,
    isLoading,
    isQuestionsCompleted,
    isQuizStarted,
    goBackToFormStep,
    setIsQuestionsCompleted,
  } = useAiRoadmapForm();

  return (
    <form onSubmit={handleSubmit(isQuizStarted ? onSubmit : onStartPersonalizedQuestions)}>
      <FieldGroup className="flex flex-col gap-5 sm:gap-6">
        <Field>
          <FieldLabel className="text-base font-normal" htmlFor="topic">
            What can I help you learn?
          </FieldLabel>
          <Input
            id="topic"
            className={cn(isQuizStarted && 'pointer-events-none cursor-not-allowed')}
            placeholder="Enter any topic that you want to learn"
            type="text"
            autoComplete="topic"
            disabled={isLoading}
            {...register('topic')}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
          <Field>
            <FieldLabel className="text-base font-normal" htmlFor="hours">
              Daily study hours?
            </FieldLabel>
            <Input
              id="hours"
              className={cn(isQuizStarted && 'pointer-events-none cursor-not-allowed')}
              placeholder="e.g. 2 hours/day"
              type="number"
              min={1}
              max={24}
              disabled={isLoading}
              {...register('hours', { valueAsNumber: true })}
            />
          </Field>
          <Field>
            <FieldLabel className="text-base font-normal" htmlFor="duration">
              Roadmap duration (months)?
            </FieldLabel>
            <Input
              id="duration"
              className={cn(isQuizStarted && 'pointer-events-none cursor-not-allowed')}
              placeholder="e.g. 3 months"
              type="number"
              min={1}
              disabled={isLoading}
              {...register('duration', { valueAsNumber: true })}
            />
          </Field>
        </div>

        {(isLoading || isQuizStarted) && (
          <PersonalizedQuestionsPanel
            isLoading={isLoading}
            onCompletedChange={setIsQuestionsCompleted}
          />
        )}

        {isQuizStarted ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              size="lg"
              variant="secondary"
              className="w-full"
              type="button"
              disabled={isLoading || isSubmitting}
              onClick={goBackToFormStep}
            >
              <HugeiconsIcon icon={ArrowLeft02FreeIcons} />
              Go back
            </Button>

            <Button
              size="lg"
              className="group/btn w-full"
              type="submit"
              disabled={!isValid || !isQuestionsCompleted || isLoading || isSubmitting}
            >
              {isSubmitting ? 'Generating...' : 'Generate roadmap'}
              {isSubmitting ? (
                <HugeiconsIcon
                  className="text-primary-foreground size-4 animate-spin"
                  icon={Loading03Icon}
                />
              ) : (
                <AnimatedIconSwap icon={ArrowRight} hoverIcon={FlaskConical} />
              )}
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            className="group/btn w-full"
            type="submit"
            disabled={!isValid || isLoading || isSubmitting}
          >
            {isLoading ? 'Saving your answers...' : 'Answer the personalized questions'}
            {isLoading ? (
              <HugeiconsIcon
                className="text-primary-foreground size-4 animate-spin"
                icon={Loading03Icon}
              />
            ) : (
              <AnimatedIconSwap icon={ArrowRight} hoverIcon={ArrowRight02FreeIcons} />
            )}
          </Button>
        )}
      </FieldGroup>
    </form>
  );
}
