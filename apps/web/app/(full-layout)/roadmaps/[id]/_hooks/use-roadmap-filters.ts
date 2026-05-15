'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDebounce } from '@/hooks/use-debounce';

import type { NodeType, ProgressStatus } from '../_types/roadmap-node.types';

import { NODE_TYPE_URL_VALUES, STATUS_URL_VALUES } from '../_types/roadmap-flow.types';

const SEARCH_DEBOUNCE_MS = 1000;

const NODE_TYPE_BY_URL_VALUE = {
  group: 'GROUP',
  milestone: 'MILESTONE',
  optional: 'OPTIONAL',
  required: 'REQUIRED',
} as const satisfies Record<string, NodeType>;

const STATUS_BY_URL_VALUE = {
  completed: 'COMPLETED',
  in_progress: 'IN_PROGRESS',
  locked: 'LOCKED',
} as const satisfies Record<string, ProgressStatus>;

function parseNodeType(value: string | null): NodeType | null {
  if (!value) return null;

  if (value in NODE_TYPE_BY_URL_VALUE) {
    return NODE_TYPE_BY_URL_VALUE[value as keyof typeof NODE_TYPE_BY_URL_VALUE];
  }

  return null;
}

function parseStatus(value: string | null): ProgressStatus | null {
  if (!value) return null;

  if (value in STATUS_BY_URL_VALUE) {
    return STATUS_BY_URL_VALUE[value as keyof typeof STATUS_BY_URL_VALUE];
  }

  return null;
}

function isAxisFilter(nodeType: NodeType | null) {
  return nodeType === 'GROUP' || nodeType === 'MILESTONE';
}

interface UpdateFiltersOptions {
  nodeType?: NodeType | null;
  q?: string | null;
  status?: ProgressStatus | null;
}

export function useRoadmapFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queuedFiltersRef = useRef<UpdateFiltersOptions | null>(null);
  const isFlushQueuedRef = useRef(false);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const nodeType = useMemo(() => parseNodeType(searchParams.get('node_type')), [searchParams]);
  const status = useMemo(() => parseStatus(searchParams.get('status')), [searchParams]);
  const shouldCompactAxis = isAxisFilter(nodeType);

  const updateUrlFilters = useCallback(
    (nextFilters: UpdateFiltersOptions) => {
      queuedFiltersRef.current = {
        ...queuedFiltersRef.current,
        ...nextFilters,
      };

      if (isFlushQueuedRef.current) return;

      isFlushQueuedRef.current = true;

      queueMicrotask(() => {
        const filtersToApply = queuedFiltersRef.current;

        queuedFiltersRef.current = null;
        isFlushQueuedRef.current = false;

        if (!filtersToApply) return;

        const params = new URLSearchParams(searchParams.toString());

        if ('status' in filtersToApply) {
          const nextStatus = filtersToApply.status;
          if (nextStatus) params.set('status', STATUS_URL_VALUES[nextStatus]);
          else params.delete('status');
        }

        if ('nodeType' in filtersToApply) {
          const nextNodeType = filtersToApply.nodeType;
          if (nextNodeType) params.set('node_type', NODE_TYPE_URL_VALUES[nextNodeType]);
          else params.delete('node_type');
        }

        if ('q' in filtersToApply) {
          const nextQuery = filtersToApply.q?.trim();
          if (nextQuery) params.set('q', nextQuery);
          else params.delete('q');
        }

        const queryString = params.toString();
        router.replace((queryString ? `${pathname}?${queryString}` : pathname) as never, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  useEffect(() => {
    if (debouncedQuery !== (searchParams.get('q') ?? '')) {
      updateUrlFilters({ q: debouncedQuery });
    }
  }, [debouncedQuery, searchParams, updateUrlFilters]);

  return {
    debouncedQuery,
    nodeType,
    query,
    setQuery,
    shouldCompactAxis,
    status,
    updateUrlFilters,
  };
}
