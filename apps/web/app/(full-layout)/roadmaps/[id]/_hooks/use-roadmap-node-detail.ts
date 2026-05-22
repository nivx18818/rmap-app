'use client';

import { useCallback, useEffect, useState } from 'react';

import { roadmapService } from '@/services/roadmap.service';

import type { RoadmapNodeDetail } from '../_types/roadmap-node-detail.types';

const NODE_DETAIL_ERROR_MESSAGE = 'Unable to load this node detail.';
const MARK_COMPLETE_ERROR_MESSAGE = 'Unable to mark this node complete. Please try again.';

interface UseRoadmapNodeDetailOptions {
  nodeId: string | null;
  onProgressUpdated?: () => void;
  roadmapId: string;
}

export function useRoadmapNodeDetail({
  nodeId,
  onProgressUpdated,
  roadmapId,
}: UseRoadmapNodeDetailOptions) {
  const [nodeDetail, setNodeDetail] = useState<RoadmapNodeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  const refreshNodeDetail = useCallback(async () => {
    if (!nodeId) {
      setNodeDetail(null);
      setErrorMessage(null);
      setActionErrorMessage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await roadmapService.getNodeDetail(roadmapId, nodeId);
      setNodeDetail(response);
    } catch {
      setNodeDetail(null);
      setErrorMessage(NODE_DETAIL_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, [nodeId, roadmapId]);

  const markComplete = useCallback(async () => {
    if (!nodeId) return;

    setIsMarkingComplete(true);
    setActionErrorMessage(null);

    try {
      const response = await roadmapService.updateNodeProgress(roadmapId, nodeId, 'COMPLETED');
      setNodeDetail((currentNodeDetail) =>
        currentNodeDetail?.id === nodeId
          ? { ...currentNodeDetail, progress: response.progress }
          : currentNodeDetail,
      );
      onProgressUpdated?.();
    } catch {
      setActionErrorMessage(MARK_COMPLETE_ERROR_MESSAGE);
    } finally {
      setIsMarkingComplete(false);
    }
  }, [nodeId, onProgressUpdated, roadmapId]);

  useEffect(() => {
    void refreshNodeDetail();
  }, [refreshNodeDetail]);

  return {
    actionErrorMessage,
    errorMessage,
    isLoading,
    isMarkingComplete,
    markComplete,
    nodeDetail,
    refreshNodeDetail,
  };
}
