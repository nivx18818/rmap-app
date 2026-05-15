'use client';

import { useCallback, useEffect, useState } from 'react';

import { roadmapService } from '@/services/roadmap.service';

import type { NodeType, ProgressStatus, RoadmapNode } from '../_types/roadmap-node.types';

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
      const response = await roadmapService.getRoadmapNodes(roadmapId, {
        nodeType: nodeType ?? undefined,
        q: searchQuery.trim() || undefined,
        status: status ?? undefined,
      });

      setRoadmapNodes(response.nodes);
    } catch {
      setErrorMessage('Unable to load this roadmap graph.');
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
