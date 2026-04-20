import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@repo/design-system/lib/toast';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import {
  type AiRoadmapValues,
  aiRoadmapSchema,
} from '@/app/(full-layout)/ai/_validation/ai-roadmap.schema';

async function mockGenerateRoadmap(values: AiRoadmapValues) {
  await new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });

  if (values.topic.trim().toLowerCase().includes('error')) {
    throw new Error('Mock API failed to generate roadmap');
  }

  return {
    roadmapTopic: values.topic,
    roadmapId: crypto.randomUUID(),
  };
}

async function mockSavePersonalizationInput() {
  await new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });
}

export function useAiRoadmapForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [isQuestionsCompleted, setIsQuestionsCompleted] = useState(false);
  const router = useRouter();

  const form = useForm<AiRoadmapValues>({
    resolver: zodResolver(aiRoadmapSchema),
    defaultValues: {
      topic: '',
      hours: undefined,
      duration: undefined,
    },
    mode: 'onChange',
  });

  const { register, handleSubmit, watch } = form;

  const [topic, hours, duration] = watch(['topic', 'hours', 'duration']);

  const isValid = aiRoadmapSchema.safeParse({
    topic,
    hours,
    duration,
    isPersonalized: true,
  }).success;

  const onStartPersonalizedQuestions: SubmitHandler<AiRoadmapValues> = async () => {
    setIsLoading(true);
    setIsQuestionsCompleted(false);

    try {
      await mockSavePersonalizationInput();
      setIsQuizStarted(true);
    } catch {
      toast.error('Failed to save your study preferences', {
        description: 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit: SubmitHandler<AiRoadmapValues> = async (values) => {
    setIsSubmitting(true);

    try {
      const result = await mockGenerateRoadmap(values);

      toast.success('Roadmap generated successfully', {
        description: `Roadmap Topic: ${result.roadmapTopic}`,
      });

      router.push(`/roadmaps/${result.roadmapId}`);
    } catch {
      toast.error('Failed to generate roadmap', {
        description: 'Please try again. Tip: any topic containing "error" will mock a failure.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBackToFormStep = () => {
    setIsQuizStarted(false);
    setIsQuestionsCompleted(false);
    setIsLoading(false);
    setIsSubmitting(false);
  };

  return {
    handleSubmit,
    isLoading,
    isQuestionsCompleted,
    isQuizStarted,
    isSubmitting,
    isValid,
    onStartPersonalizedQuestions,
    onSubmit,
    register,
    goBackToFormStep,
    setIsQuestionsCompleted,
  };
}
