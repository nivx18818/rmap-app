'use client';

import { InlineNotice } from '@repo/design-system/components/common/inline-notice';
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
import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { AdminActivityType, AdminDashboardResponse } from '@/types/admin-content';

import { adminContentService, getApiErrorMessage } from '@/services/admin-content.service';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
  year: 'numeric',
});

const ACTIVITY_LABELS: Record<AdminActivityType, string> = {
  resource: 'Resource',
  skill: 'Skill',
  template: 'Template',
  template_node: 'Template node',
};

export function AdminDashboardContent() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setError(null);

    void adminContentService
      .getDashboard()
      .then((response) => {
        if (!isCurrent) return;
        setDashboard(response);
      })
      .catch((unknownError: unknown) => {
        if (!isCurrent) return;
        setError(getApiErrorMessage(unknownError, 'Unable to load admin dashboard.'));
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <section className="border-border/70 bg-card/90 overflow-hidden rounded-3xl border p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex max-w-3xl flex-col gap-2">
            <p className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
              Admin overview
            </p>
            <h1 className="font-heading text-foreground text-3xl leading-tight sm:text-4xl">
              Content operations dashboard
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Monitor catalog volume and jump into the content workflows that shape learner
              roadmaps.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setRefreshKey((current) => current + 1)}>
              Refresh
            </Button>
            <Button render={<Link href="/admin/skills">Manage skills</Link>} />
          </div>
        </div>
      </section>

      {error ? (
        <InlineNotice title="Dashboard unavailable" tone="error" description={error} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Skills" isLoading={isLoading} value={dashboard?.totals.skills} />
        <MetricCard label="Templates" isLoading={isLoading} value={dashboard?.totals.templates} />
        <MetricCard label="Resources" isLoading={isLoading} value={dashboard?.totals.resources} />
        <MetricCard
          label="Template nodes"
          isLoading={isLoading}
          value={dashboard?.totals.templateNodes}
        />
      </div>

      <Card className="bg-card/90 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Latest content changes derived from skills, templates, resources, and template nodes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !dashboard ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 rounded-2xl" />
              ))}
            </div>
          ) : dashboard?.recentActivity.length ? (
            <div className="flex flex-col gap-3">
              {dashboard.recentActivity.map((activity) => (
                <article
                  key={`${activity.type}-${activity.id}`}
                  className="border-border/80 bg-background/70 flex flex-col gap-2 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{ACTIVITY_LABELS[activity.type]}</Badge>
                      <h2 className="truncate text-sm font-medium">{activity.label}</h2>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Updated {formatDate(activity.timestamp)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <InlineNotice
              title="No content activity yet"
              description="Create skills, resources, or templates to populate the activity feed."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  isLoading,
  label,
  value,
}: {
  isLoading: boolean;
  label: string;
  value: number | undefined;
}) {
  return (
    <Card className="bg-card/90 backdrop-blur-md">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">
          {isLoading && value === undefined ? <Skeleton className="h-9 w-20" /> : (value ?? 0)}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 'Unknown' : DATE_FORMATTER.format(date);
}
