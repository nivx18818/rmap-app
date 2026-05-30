'use client';

import { useCallback, useEffect, useState } from 'react';

import { dashboardService } from '@/services/dashboard.service';

import type { Dashboard } from '../_types/dashboard.types';

const DASHBOARD_ERROR_MESSAGE = 'Unable to load your dashboard.';

export function useDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await dashboardService.getDashboard();
      setDashboard(response);
    } catch {
      setDashboard(null);
      setErrorMessage(DASHBOARD_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  return {
    dashboard,
    errorMessage,
    isLoading,
    refreshDashboard,
  };
}
