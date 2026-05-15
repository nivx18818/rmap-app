'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useDebounce } from '@/hooks/use-debounce';

import type { UpdateRoadmapFiltersOptions } from '../_types/roadmap-filter.types';

import { SEARCH_DEBOUNCE_MS } from '../_constants/roadmap-filter.constants';
import {
  getNodeTypeUrlValue,
  getStatusUrlValue,
  isAxisFilter,
  parseNodeTypeFromUrl,
  parseStatusFromUrl,
} from '../_utils/roadmap-filter.utils';

export function useRoadmapFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queuedFiltersRef = useRef<UpdateRoadmapFiltersOptions | null>(null);
  const isFlushQueuedRef = useRef(false);
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS);
  const nodeType = useMemo(
    () => parseNodeTypeFromUrl(searchParams.get('node_type')),
    [searchParams],
  );
  const status = useMemo(() => parseStatusFromUrl(searchParams.get('status')), [searchParams]);
  const shouldCompactAxis = isAxisFilter(nodeType);

  const updateUrlFilters = useCallback(
    (nextFilters: UpdateRoadmapFiltersOptions) => {
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
          if (nextStatus) params.set('status', getStatusUrlValue(nextStatus));
          else params.delete('status');
        }

        if ('nodeType' in filtersToApply) {
          const nextNodeType = filtersToApply.nodeType;
          if (nextNodeType) params.set('node_type', getNodeTypeUrlValue(nextNodeType));
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
