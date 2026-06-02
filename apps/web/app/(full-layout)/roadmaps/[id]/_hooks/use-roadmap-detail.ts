'use client';

import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

import { publicTemplateService } from '@/services/public-template.service';
import { roadmapService } from '@/services/roadmap.service';

import type { RoadmapDetail } from '../_types/roadmap-detail.types';

const ROADMAP_DETAIL_ERROR_MESSAGE = 'Unable to load this roadmap detail.';

export type RoadmapDetailMode = 'authenticated' | 'template';

interface UseRoadmapDetailOptions {
  isAuthenticated: boolean;
  roadmapId: string;
}

function isNotFoundError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

export function useRoadmapDetail({ isAuthenticated, roadmapId }: UseRoadmapDetailOptions) {
  const [roadmap, setRoadmap] = useState<RoadmapDetail | null>(null);
  const [mode, setMode] = useState<RoadmapDetailMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshRoadmapDetail = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setRoadmap(null);
    setMode(null);

    if (isAuthenticated) {
      try {
        const response = await roadmapService.getById(roadmapId);
        setRoadmap(response);
        setMode('authenticated');
        setIsLoading(false);
        return;
      } catch (roadmapError) {
        if (!isNotFoundError(roadmapError)) {
          setRoadmap(null);
          setMode(null);
          setErrorMessage(ROADMAP_DETAIL_ERROR_MESSAGE);
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      const template = await publicTemplateService.getById(roadmapId);
      setRoadmap(template);
      setMode('template');
    } catch {
      setRoadmap(null);
      setMode(null);
      setErrorMessage(ROADMAP_DETAIL_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, roadmapId]);

  useEffect(() => {
    void refreshRoadmapDetail();
  }, [refreshRoadmapDetail]);

  return {
    errorMessage,
    isLoading,
    mode,
    refreshRoadmapDetail,
    roadmap,
  };
}
