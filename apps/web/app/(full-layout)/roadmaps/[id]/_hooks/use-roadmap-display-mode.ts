'use client';

import { useEffect, useState } from 'react';

import type { RoadmapDisplayMode } from '../_components/roadmap-filter-bar';

const ROADMAP_DISPLAY_MODE_STORAGE_KEY = 'rmap-roadmap-display-mode';

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
