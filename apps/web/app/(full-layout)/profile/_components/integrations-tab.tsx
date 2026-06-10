'use client';

import { Calendar01Icon, GithubIcon, Mail01Icon, Refresh01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@repo/design-system/components/ui/alert-dialog';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { TabsContent } from '@repo/design-system/components/ui/tabs';
import { useState } from 'react';

import type { OAuthProvider, UserIntegration } from '@/types/auth';

import { GoogleIcon } from '@/components/shared/oauth-icon';
import { buildOAuthLoginUrl } from '@/utils/auth-callback';

import { useIntegrations } from '../_hooks/use-integrations';

const PROVIDER_LABELS = {
  GITHUB: 'GitHub',
  GOOGLE: 'Google',
} satisfies Record<OAuthProvider, string>;

function ProviderIcon({ provider }: { provider: OAuthProvider }) {
  if (provider === 'GITHUB') {
    return <HugeiconsIcon className="size-5" icon={GithubIcon} />;
  }

  return <GoogleIcon />;
}

function formatConnectedDate(value: null | string) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

interface IntegrationRowProps {
  disconnectingProvider: OAuthProvider | null;
  integration: UserIntegration;
  onDisconnect: (provider: OAuthProvider) => Promise<void>;
}

function IntegrationRow({ disconnectingProvider, integration, onDisconnect }: IntegrationRowProps) {
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
  const providerLabel = PROVIDER_LABELS[integration.provider];
  const connectedDate = formatConnectedDate(integration.connectedAt);
  const isDisconnecting = disconnectingProvider === integration.provider;

  const handleConnect = () => {
    const provider = integration.provider.toLowerCase() as 'github' | 'google';
    window.location.href = buildOAuthLoginUrl(provider, '/profile?tab=integrations');
  };

  const handleOpenDisconnectDialog = () => {
    setIsDisconnectDialogOpen(true);
  };

  const handleDisconnectDialogChange = (open: boolean) => {
    setIsDisconnectDialogOpen(open);
  };

  const handleConfirmDisconnect = () => {
    void onDisconnect(integration.provider).then(() => {
      setIsDisconnectDialogOpen(false);
    });
  };

  return (
    <div className="grid gap-4 border-b px-6 py-5 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="flex min-w-0 gap-3">
        <div className="bg-muted text-heading flex size-10 shrink-0 items-center justify-center rounded-lg">
          <ProviderIcon provider={integration.provider} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-heading text-sm font-medium">{providerLabel}</h3>
            <Badge variant={integration.connected ? 'secondary' : 'outline'}>
              {integration.connected ? 'Connected' : 'Not connected'}
            </Badge>
          </div>
          <div className="text-muted-foreground mt-1 flex flex-col gap-1 text-sm">
            {integration.providerEmail ? (
              <span className="flex min-w-0 items-center gap-2">
                <HugeiconsIcon className="size-4 shrink-0" icon={Mail01Icon} />
                {integration.providerEmail}
              </span>
            ) : (
              <span>No {providerLabel} account connected.</span>
            )}
            {connectedDate && (
              <span className="flex min-w-0 items-center gap-2">
                <HugeiconsIcon className="size-4 shrink-0" icon={Calendar01Icon} />
                <span>{connectedDate}</span>
              </span>
            )}
            {integration.connected && !integration.canDisconnect && (
              <span>Add a password or connect another provider before disconnecting.</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex md:justify-end">
        {integration.connected ? (
          <>
            <Button
              variant="destructive"
              size="sm"
              type="button"
              disabled={!integration.canDisconnect || isDisconnecting}
              onClick={handleOpenDisconnectDialog}
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </Button>
            <AlertDialog open={isDisconnectDialogOpen} onOpenChange={handleDisconnectDialogChange}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia className="bg-destructive/10 text-destructive">
                    <HugeiconsIcon icon={Refresh01Icon} />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Disconnect {providerLabel}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will no longer be able to use this {providerLabel} account to sign in unless
                    you reconnect it later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel variant="ghost" disabled={isDisconnecting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={isDisconnecting}
                    onClick={handleConfirmDisconnect}
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="group/btn"
            type="button"
            onClick={handleConnect}
          >
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}

function IntegrationsSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="grid gap-4 px-6 py-5 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      ))}
    </div>
  );
}

export function IntegrationsTab() {
  const { disconnectingProvider, disconnectIntegration, integrations, isLoading } =
    useIntegrations();

  return (
    <TabsContent value="integrations">
      <Card className="rounded-lg">
        <CardHeader className="border-b">
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Connect external accounts used for sign-in and future roadmap validation.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 py-0">
          {isLoading ? (
            <IntegrationsSkeleton />
          ) : (
            integrations.map((integration) => (
              <IntegrationRow
                key={integration.provider}
                disconnectingProvider={disconnectingProvider}
                integration={integration}
                onDisconnect={disconnectIntegration}
              />
            ))
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
