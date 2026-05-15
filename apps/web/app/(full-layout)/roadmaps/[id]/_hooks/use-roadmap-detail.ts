'use client';

import { useCallback, useEffect, useState } from 'react';

import { roadmapService } from '@/services/roadmap.service';

import type { RoadmapDetail } from '../_types/roadmap-detail.types';

const ROADMAP_DETAIL_ERROR_MESSAGE = 'Unable to load this roadmap detail.';

interface UseRoadmapDetailOptions {
  roadmapId: string;
}

export function useRoadmapDetail({ roadmapId }: UseRoadmapDetailOptions) {
  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshRoadmapDetail = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await roadmapService.getById(roadmapId);
      setRoadmap(response);
    } catch {
      setRoadmap(null);
      setErrorMessage(ROADMAP_DETAIL_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, [roadmapId]);

  useEffect(() => {
    void refreshRoadmapDetail();
  }, [refreshRoadmapDetail]);

  return {
    errorMessage,
    isLoading,
    refreshRoadmapDetail,
    roadmap,
  };
}
