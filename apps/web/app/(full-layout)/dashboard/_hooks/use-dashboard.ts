'use client';

import { useCallback, useEffect, useState } from 'react';

import { dashboardService } from '@/services/dashboard.service';

import type { Dashboard } from '../_types/dashboard.types';

const DASHBOARD_ERROR_MESSAGE = 'Unable to load your dashboard.';

interface RefreshDashboardOptions {
  silent?: boolean;
}

export function useDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshDashboard = useCallback(async (options: RefreshDashboardOptions = {}) => {
    const isSilent = options.silent ?? false;

    if (!isSilent) {
      setIsLoading(true);
      setErrorMessage(null);
    }

    try {
      const response = await dashboardService.getDashboard();
      setDashboard(response);
      setErrorMessage(null);
    } catch {
      if (!isSilent) {
        setDashboard(null);
        setErrorMessage(DASHBOARD_ERROR_MESSAGE);
      }
    } finally {
      if (!isSilent) {
        setIsLoading(false);
      }
    }
  }, []);

  const updateDashboard = useCallback(
    (updater: (dashboard: Dashboard | null) => Dashboard | null) => {
      setDashboard(updater);
    },
    [],
  );

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  return {
    dashboard,
    errorMessage,
    isLoading,
    refreshDashboard,
    updateDashboard,
  };
}
