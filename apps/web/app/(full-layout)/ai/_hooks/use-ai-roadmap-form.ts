import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@repo/design-system/lib/toast';
import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';

import {
  type AiRoadmapValues,
  aiRoadmapSchema,
} from '@/app/(full-layout)/ai/_validation/ai-roadmap.schema';

async function mockGenerateRoadmap(values: AiRoadmapValues) {
  await new Promise((resolve) => {
    setTimeout(resolve, 1200);
  });

  if (values.topic.trim().toLowerCase().includes('error')) {
    throw new Error('Mock API failed to generate roadmap');
  }

  return {
    roadmapId: crypto.randomUUID(),
  };
}

export function useAiRoadmapForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AiRoadmapValues>({
    resolver: zodResolver(aiRoadmapSchema),
    defaultValues: {
      topic: '',
      hours: 0,
      duration: 0,
      isPersonalized: false,
    },
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isValid },
  } = form;

  const isPersonalized = watch('isPersonalized');

  const handleCheckedChange = (checked: boolean) => {
    setValue('isPersonalized', checked);

    if (!checked) {
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };

  const onSubmit: SubmitHandler<AiRoadmapValues> = async (values) => {
    setIsSubmitting(true);

    try {
      const result = await mockGenerateRoadmap(values);

      toast.success('Roadmap generated successfully', {
        description: `Roadmap ID: ${result.roadmapId}`,
      });
    } catch {
      toast.error('Failed to generate roadmap', {
        description: 'Please try again. Tip: any topic containing "error" will mock a failure.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleCheckedChange,
    handleSubmit,
    isLoading,
    isPersonalized,
    isSubmitting,
    isValid,
    onSubmit,
    register,
  };
}
