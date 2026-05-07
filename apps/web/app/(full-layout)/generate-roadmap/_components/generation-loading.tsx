'use client';

import { LoadingState } from '@/components/shared/loading-state';

export function GenerationLoading() {
  return (
    <LoadingState
      message="Generating your personalized roadmap..."
      description="Our AI is analyzing your goals, timeline, and quiz answers to build the perfect learning
        path for you."
    />
  );
}
