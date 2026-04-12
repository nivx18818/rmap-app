'use client';

import { ArrowRight, FlaskConical, Loading03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatedIconSwap } from '@repo/design-system/components/common/animated-icon-swap';
import { Button } from '@repo/design-system/components/ui/button';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@repo/design-system/components/ui/field';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';

import { useAiRoadmapForm } from '@/app/(full-layout)/ai/_hooks/use-ai-roadmap-form';

import { PersonalizedQuestionsPanel } from './personalized-questions-panel';

export function AiRoadmapForm() {
  const {
    register,
    handleSubmit,
    onSubmit,
    isValid,
    isSubmitting,
    isPersonalized,
    isLoading,
    handleCheckedChange,
  } = useAiRoadmapForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="flex flex-col gap-5 sm:gap-6">
        <Field>
          <FieldLabel className="text-base font-normal" htmlFor="topic">
            What can I help you learn?
          </FieldLabel>
          <Input
            id="topic"
            placeholder="Enter any topic that you want to learn"
            type="text"
            autoComplete="topic"
            {...register('topic')}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
          <Field>
            <FieldLabel className="text-base font-normal" htmlFor="hours">
              Hours per day
            </FieldLabel>
            <Input
              id="hours"
              placeholder="e.g. 2"
              type="number"
              min={1}
              max={24}
              {...register('hours', { valueAsNumber: true })}
            />
          </Field>
          <Field>
            <FieldLabel className="text-base font-normal" htmlFor="duration">
              Duration (months)
            </FieldLabel>
            <Input
              id="duration"
              placeholder="e.g. 3"
              type="number"
              min={1}
              {...register('duration', { valueAsNumber: true })}
            />
          </Field>
        </div>

        <Field orientation="horizontal">
          <Checkbox
            id="questions-checkbox"
            checked={isPersonalized}
            onCheckedChange={handleCheckedChange}
          />
          <Label className="text-sm font-normal sm:text-base" htmlFor="questions-checkbox">
            Answer the following questions for a better roadmap
          </Label>
        </Field>

        {isPersonalized && <PersonalizedQuestionsPanel isLoading={isLoading} />}

        <Button
          size="lg"
          className="group/btn w-full"
          type="submit"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? 'Generating...' : 'Generate Roadmap'}
          {isSubmitting ? (
            <HugeiconsIcon
              className="text-primary-foreground size-4 animate-spin"
              icon={Loading03Icon}
            />
          ) : (
            <AnimatedIconSwap icon={ArrowRight} hoverIcon={FlaskConical} />
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
