'use client';

import { toast } from '@repo/design-system/lib/toast';
import { useCallback, useEffect, useState } from 'react';

import { roadmapService } from '@/services/roadmap.service';

import type { RoadmapNodeDetail } from '../_types/roadmap-node-detail.types';
import type { RoadmapNode } from '../_types/roadmap-node.types';

const NODE_DETAIL_ERROR_MESSAGE = 'Unable to load this node detail.';
const MARK_COMPLETE_ERROR_MESSAGE = 'Unable to mark this node complete. Please try again.';
const MILESTONE_SUBMIT_ERROR_MESSAGE = 'Unable to submit this project. Please try again.';
const RUNNING_SUBMISSION_REFRESH_MS = 3_000;

interface UseRoadmapNodeDetailOptions {
  canFetchProtectedDetail?: boolean;
  nodeId: string | null;
  onProgressUpdated?: () => void;
  roadmapId: string;
  roadmapNodes?: RoadmapNode[];
}

interface RefreshNodeDetailOptions {
  silent?: boolean;
}

export function useRoadmapNodeDetail({
  canFetchProtectedDetail = true,
  nodeId,
  onProgressUpdated,
  roadmapId,
  roadmapNodes = [],
}: UseRoadmapNodeDetailOptions) {
  const [nodeDetail, setNodeDetail] = useState<RoadmapNodeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  const refreshNodeDetail = useCallback(
    async (options: RefreshNodeDetailOptions = {}) => {
      if (!nodeId) {
        setNodeDetail(null);
        setErrorMessage(null);
        setActionErrorMessage(null);
        setIsLoading(false);
        return;
      }

      if (!canFetchProtectedDetail) {
        const selectedNode = roadmapNodes.find((node) => node.id === nodeId);

        setNodeDetail(
          selectedNode
            ? {
                description: selectedNode.description,
                estimatedHours: selectedNode.estimatedHours,
                id: selectedNode.id,
                latestSubmission: null,
                name: selectedNode.name,
                nodeType: selectedNode.nodeType,
                prerequisites: [],
                progress: null,
                projectBrief:
                  selectedNode.nodeType === 'MILESTONE'
                    ? (selectedNode.description ?? undefined)
                    : undefined,
                resources: [],
              }
            : null,
        );
        setErrorMessage(selectedNode ? null : NODE_DETAIL_ERROR_MESSAGE);
        setActionErrorMessage(null);
        setIsLoading(false);
        return;
      }

      if (!options.silent) {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        const response = await roadmapService.getNodeDetail(roadmapId, nodeId);
        setNodeDetail(response);
      } catch {
        setNodeDetail(null);
        setErrorMessage(NODE_DETAIL_ERROR_MESSAGE);
      } finally {
        if (!options.silent) {
          setIsLoading(false);
        }
      }
    },
    [canFetchProtectedDetail, nodeId, roadmapId, roadmapNodes],
  );

  const markComplete = useCallback(
    async (options: { forceComplete?: boolean } = {}) => {
      if (!canFetchProtectedDetail || !nodeId) return;

      setIsMarkingComplete(true);
      setActionErrorMessage(null);

      try {
        const response = await roadmapService.updateNodeProgress(
          roadmapId,
          nodeId,
          'COMPLETED',
          options,
        );
        setNodeDetail((currentNodeDetail) =>
          currentNodeDetail?.id === nodeId
            ? { ...currentNodeDetail, progress: response.progress }
            : currentNodeDetail,
        );
        toast.success('Node completed', {
          description:
            response.unlockedNodes.length > 0
              ? `${response.unlockedNodes.length} new node${response.unlockedNodes.length === 1 ? '' : 's'} unlocked.`
              : 'Roadmap progress updated.',
        });
        onProgressUpdated?.();
      } catch {
        setActionErrorMessage(MARK_COMPLETE_ERROR_MESSAGE);
        toast.error(MARK_COMPLETE_ERROR_MESSAGE);
      } finally {
        setIsMarkingComplete(false);
      }
    },
    [canFetchProtectedDetail, nodeId, onProgressUpdated, roadmapId],
  );

  const submitMilestoneSubmission = useCallback(
    async (payload: { repoUrl: string; testCommand?: string }) => {
      if (!canFetchProtectedDetail || !nodeId) return;

      setActionErrorMessage(null);

      try {
        const response = await roadmapService.submitMilestoneSubmission(roadmapId, nodeId, payload);
        setNodeDetail((currentNodeDetail) =>
          currentNodeDetail?.id === nodeId
            ? { ...currentNodeDetail, latestSubmission: response.submission }
            : currentNodeDetail,
        );
      } catch {
        setActionErrorMessage(MILESTONE_SUBMIT_ERROR_MESSAGE);
      }
    },
    [canFetchProtectedDetail, nodeId, roadmapId],
  );

  useEffect(() => {
    void refreshNodeDetail();
  }, [refreshNodeDetail]);

  useEffect(() => {
    if (!canFetchProtectedDetail || nodeDetail?.latestSubmission?.status !== 'RUNNING') return;

    const intervalId = window.setInterval(() => {
      void refreshNodeDetail({ silent: true });
    }, RUNNING_SUBMISSION_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [canFetchProtectedDetail, nodeDetail?.latestSubmission?.status, refreshNodeDetail]);

  return {
    actionErrorMessage,
    errorMessage,
    isLoading,
    isMarkingComplete,
    markComplete,
    nodeDetail,
    refreshNodeDetail,
    submitMilestoneSubmission,
  };
}
