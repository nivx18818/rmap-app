'use client';

import { useEffect, useState } from 'react';

import type { RoadmapDisplayMode } from '../_types/roadmap-display-mode.types';

import { ROADMAP_DISPLAY_MODE_STORAGE_KEY } from '../_constants/roadmap-filter.constants';

function parseDisplayMode(value: string | null): RoadmapDisplayMode | null {
  if (value === 'stack-list' || value === 'skill-tree') return value;
  return null;
}

export function useRoadmapDisplayMode() {
  const [displayMode, setDisplayMode] = useState<RoadmapDisplayMode>('skill-tree');

  useEffect(() => {
    const storedDisplayMode = parseDisplayMode(
      window.localStorage.getItem(ROADMAP_DISPLAY_MODE_STORAGE_KEY),
    );

    if (storedDisplayMode) {
      setDisplayMode(storedDisplayMode);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ROADMAP_DISPLAY_MODE_STORAGE_KEY, displayMode);
  }, [displayMode]);

  return { displayMode, setDisplayMode };
}
