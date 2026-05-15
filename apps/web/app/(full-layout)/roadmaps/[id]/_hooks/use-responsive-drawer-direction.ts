'use client';

import { useEffect, useState } from 'react';

export function useResponsiveDrawerDirection() {
  const [drawerDirection, setDrawerDirection] = useState<'bottom' | 'right'>('bottom');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const updateDrawerDirection = () => {
      setDrawerDirection(mediaQuery.matches ? 'right' : 'bottom');
    };

    updateDrawerDirection();
    mediaQuery.addEventListener('change', updateDrawerDirection);

    return () => mediaQuery.removeEventListener('change', updateDrawerDirection);
  }, []);

  return drawerDirection;
}
