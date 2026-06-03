'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import { buildNodeSlug, tryDecodeReadableUrlId } from '@/utils/roadmap-url';

interface SelectableRoadmapNode {
  id: string;
  name: string;
}

export function useRoadmapNodeSelection() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedNodeId = useMemo(
    () => tryDecodeReadableUrlId(searchParams.get('node')),
    [searchParams],
  );

  const updateSelectedNode = useCallback(
    (node: SelectableRoadmapNode | null) => {
      const params = new URLSearchParams(searchParams.toString());

      params.delete('nodeId');

      if (node) params.set('node', buildNodeSlug(node));
      else params.delete('node');

      const queryString = params.toString();
      router.replace((queryString ? `${pathname}?${queryString}` : pathname) as never, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );
  const clearSelectedNode = useCallback(() => updateSelectedNode(null), [updateSelectedNode]);

  return {
    clearSelectedNode,
    selectNode: updateSelectedNode,
    selectedNodeId,
  };
}
