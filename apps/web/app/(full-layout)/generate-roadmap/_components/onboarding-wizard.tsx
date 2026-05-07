'use client';

import { useOnboardingWizard } from '@/app/(full-layout)/generate-roadmap/_hooks/use-onboarding-wizard';

import { AiRoadmapForm } from './ai-roadmap-form';
import { GenerationError } from './generation-error';
import { GenerationLoading } from './generation-loading';
import { GenerationSuccess } from './generation-success';
import { StepQuiz } from './step-quiz';

export function OnboardingWizard() {
  const {
    step,
    stepOneData,
    quizAnswers,
    setStepOneData,
    setRoleCategory,
    setQuizAnswers,
    nextStep,
    prevStep,
    submitGenerate,
    resetToStart,
    isGenerating,
    timelineWarning,
    generatedRoadmapId,
  } = useOnboardingWizard();

  let title = '';
  let description = '';

  if (step === 1) {
    title = 'What can I help you learn?';
    description = 'Enter a topic below to generate a personalized roadmap for it.';
  } else if (step === 2) {
    title = "Let's personalize your learning path";
    description = 'Answer these quick questions to tailor the roadmap for you.';
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {typeof step === 'number' && (
        <div className="mb-2 flex flex-col items-center gap-2 text-center">
          <h2 className="text-foreground text-3xl leading-tight font-medium tracking-[-0.8px] sm:text-4xl sm:tracking-[-1px]">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-2xl text-base leading-[1.7] sm:text-lg">
            {description}
          </p>
        </div>
      )}

      <div className="w-full">
        {step === 1 && (
          <AiRoadmapForm
            initialData={stepOneData}
            onNext={(data) => {
              setStepOneData(data);
              nextStep();
            }}
          />
        )}

        {step === 2 && (
          <StepQuiz
            goal={stepOneData.goal}
            initialAnswers={quizAnswers}
            onAnswersChange={setQuizAnswers}
            onRoleCategoryLoaded={setRoleCategory}
            onBack={prevStep}
            isGenerating={isGenerating}
            onSubmit={submitGenerate}
          />
        )}

        {step === 'loading' && <GenerationLoading />}

        {step === 'success' && (
          <GenerationSuccess
            generatedRoadmapId={generatedRoadmapId}
            timelineWarning={timelineWarning}
            onRecreate={resetToStart}
          />
        )}

        {step === 'error' && <GenerationError onRetry={resetToStart} />}
      </div>
    </div>
  );
}
