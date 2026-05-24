'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export function useRoadmapNodeSelection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedNodeId = useMemo(() => searchParams.get('nodeId'), [searchParams]);

  const updateSelectedNodeId = useCallback(
    (nodeId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nodeId) params.set('nodeId', nodeId);
      else params.delete('nodeId');

      const queryString = params.toString();
      router.replace((queryString ? `${pathname}?${queryString}` : pathname) as never, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );
  const clearSelectedNode = useCallback(() => updateSelectedNodeId(null), [updateSelectedNodeId]);

  return {
    clearSelectedNode,
    selectNode: updateSelectedNodeId,
    selectedNodeId,
  };
}
