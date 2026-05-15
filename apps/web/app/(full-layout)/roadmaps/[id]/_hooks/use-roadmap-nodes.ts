'use client';

import { useCallback, useEffect, useState } from 'react';

import { roadmapService } from '@/services/roadmap.service';

import type { NodeType, ProgressStatus, RoadmapNode } from '../_types/roadmap-node.types';

import { ROADMAP_NODES_ERROR_MESSAGE } from '../_constants/roadmap-filter.constants';
import { buildRoadmapNodesFilter } from '../_utils/roadmap-filter.utils';

interface UseRoadmapNodesOptions {
  enabled?: boolean;
  nodeType: NodeType | null;
  roadmapId: string;
  searchQuery: string;
  status: ProgressStatus | null;
}

export function useRoadmapNodes({
  enabled = true,
  nodeType,
  roadmapId,
  searchQuery,
  status,
}: UseRoadmapNodesOptions) {
  const [roadmapNodes, setRoadmapNodes] = useState<RoadmapNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshRoadmapNodes = useCallback(async () => {
    if (!enabled) {
      setRoadmapNodes([]);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await roadmapService.getRoadmapNodes(
        roadmapId,
        buildRoadmapNodesFilter({ nodeType, searchQuery, status }),
      );

      setRoadmapNodes(response.nodes);
    } catch {
      setErrorMessage(ROADMAP_NODES_ERROR_MESSAGE);
      setRoadmapNodes([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, nodeType, roadmapId, searchQuery, status]);

  useEffect(() => {
    void refreshRoadmapNodes();
  }, [refreshRoadmapNodes]);

  return { errorMessage, isLoading, refreshRoadmapNodes, roadmapNodes };
}
