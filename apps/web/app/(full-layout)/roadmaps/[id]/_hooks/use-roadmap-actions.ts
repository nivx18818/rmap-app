import { toast } from '@repo/design-system/lib/toast';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { roadmapService } from '@/services/roadmap.service';

interface UseRoadmapActionsProps {
  roadmapId: string;
  refreshRoadmapDetail: () => Promise<void>;
  refreshProgressSummary: () => Promise<void>;
  onGraphRefreshNeeded: () => void;
}

export function useRoadmapActions({
  roadmapId,
  refreshRoadmapDetail,
  refreshProgressSummary,
  onGraphRefreshNeeded,
}: UseRoadmapActionsProps) {
  const router = useRouter();
  const [isRecreatingRoadmap, setIsRecreatingRoadmap] = useState(false);
  const [isStartingLearning, setIsStartingLearning] = useState(false);

  const handleStartLearning = useCallback(async () => {
    setIsStartingLearning(true);

    try {
      await roadmapService.startLearning(roadmapId);
      await Promise.all([refreshRoadmapDetail(), refreshProgressSummary()]);
      onGraphRefreshNeeded();
      toast.success('Roadmap started! Best of luck on your learning journey.');
    } catch {
      toast.error('Unable to start this roadmap. Please try again.');
    } finally {
      setIsStartingLearning(false);
    }
  }, [roadmapId, refreshRoadmapDetail, refreshProgressSummary, onGraphRefreshNeeded]);

  const handleRecreateRoadmap = useCallback(async () => {
    setIsRecreatingRoadmap(true);

    try {
      await roadmapService.deleteRoadmap(roadmapId);
      toast.success('Roadmap removed. Create a new one when you are ready.');
      router.push('/roadmaps/generate');
    } catch {
      toast.error('Unable to recreate this roadmap. Please try again.');
      setIsRecreatingRoadmap(false);
    }
  }, [roadmapId, router]);

  return {
    isRecreatingRoadmap,
    isStartingLearning,
    handleStartLearning,
    handleRecreateRoadmap,
  };
}
