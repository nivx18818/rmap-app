'use client';

import { useCallback, useEffect, useState } from 'react';

import { roadmapService } from '@/services/roadmap.service';

import type { RoadmapProgressSummary } from '../_types/roadmap-progress.types';

const ROADMAP_PROGRESS_ERROR_MESSAGE = 'Unable to load roadmap progress.';

interface UseRoadmapProgressSummaryOptions {
  enabled?: boolean;
  roadmapId: string;
}

export function useRoadmapProgressSummary({
  enabled = true,
  roadmapId,
}: UseRoadmapProgressSummaryOptions) {
  const [summary, setSummary] = useState<RoadmapProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshProgressSummary = useCallback(async () => {
    if (!enabled) {
      setSummary(null);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await roadmapService.getProgressSummary(roadmapId);
      setSummary(response);
    } catch {
      setSummary(null);
      setErrorMessage(ROADMAP_PROGRESS_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, roadmapId]);

  useEffect(() => {
    void refreshProgressSummary();
  }, [refreshProgressSummary]);

  return {
    errorMessage,
    isLoading,
    refreshProgressSummary,
    summary,
  };
}
