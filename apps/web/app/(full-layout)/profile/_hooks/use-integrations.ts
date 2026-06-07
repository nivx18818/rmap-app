'use client';

import { toast } from '@repo/design-system/lib/toast';
import { useCallback, useEffect, useState } from 'react';

import type { OAuthProvider, UserIntegration } from '@/types/auth';

import { authService } from '@/services/auth.service';

export function useIntegrations() {
  const [disconnectingProvider, setDisconnectingProvider] = useState<OAuthProvider | null>(null);
  const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadIntegrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authService.getIntegrations();
      setIntegrations(response);
    } catch {
      toast.error('Integrations failed to load', {
        description: 'Refresh the page and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIntegrations();
  }, [loadIntegrations]);

  const disconnectIntegration = useCallback(
    async (provider: OAuthProvider) => {
      setDisconnectingProvider(provider);
      try {
        await authService.disconnectIntegration(provider);
        await loadIntegrations();
        toast.success('Integration disconnected');
      } catch {
        toast.error('Disconnect failed', {
          description: 'Make sure another sign-in method is available first.',
        });
      } finally {
        setDisconnectingProvider(null);
      }
    },
    [loadIntegrations],
  );

  return {
    disconnectingProvider,
    disconnectIntegration,
    integrations,
    isLoading,
  };
}
