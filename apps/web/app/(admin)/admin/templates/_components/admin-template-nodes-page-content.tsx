'use client';

import type { Route } from 'next';

import { ArrowLeftIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { InlineNotice } from '@repo/design-system/components/common/inline-notice';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { AdminTemplate, RoleCategory } from '@/types/admin-content';

import { adminContentService, getApiErrorMessage } from '@/services/admin-content.service';

import { AdminTemplateNodesPanel } from './admin-template-nodes-panel';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function AdminTemplateNodesPageContent({ templateId }: { templateId: string }) {
  const [template, setTemplate] = useState<AdminTemplate | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateRefreshKey, setTemplateRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    setIsLoadingTemplate(true);
    setTemplateError(null);

    void adminContentService
      .getTemplate(templateId)
      .then((response) => {
        if (!isCurrent) return;
        setTemplate(response);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setTemplate(null);
        setTemplateError(getApiErrorMessage(error, 'Unable to load this template.'));
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingTemplate(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [templateId, templateRefreshKey]);

  const refreshTemplate = () => {
    setTemplateRefreshKey((current) => current + 1);
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <section className="border-border/70 bg-card/90 rounded-3xl border p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex max-w-3xl flex-col gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit px-0 hover:bg-transparent"
              render={
                <Link href={'/admin/templates' as Route<string>}>
                  <HugeiconsIcon data-icon="inline-start" icon={ArrowLeftIcon} />
                  Templates
                </Link>
              }
            />
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-foreground text-3xl leading-tight sm:text-4xl">
                Template node editor
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Edit grouped sections and lessons for the selected roadmap template.
              </p>
            </div>
            {template ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{template.title}</Badge>
                <Badge variant="outline">{formatEnumLabel(template.roleCategory)}</Badge>
                <Badge variant="outline">Updated {formatDate(template.updatedAt)}</Badge>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={isLoadingTemplate}
              onClick={() => refreshTemplate()}
            >
              Refresh metadata
            </Button>
          </div>
        </div>
      </section>

      {isLoadingTemplate ? (
        <TemplateMetadataPlaceholder />
      ) : templateError ? (
        <InlineNotice title="Template unavailable" tone="error" description={templateError} />
      ) : (
        <AdminTemplateNodesPanel selectedTemplate={template} />
      )}
    </div>
  );
}

function TemplateMetadataPlaceholder() {
  return (
    <div className="border-border/70 bg-card/90 rounded-3xl border p-5 shadow-sm backdrop-blur-md">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-5 w-48 rounded-full" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 'Unknown' : DATE_FORMATTER.format(date);
}

function formatEnumLabel(value: RoleCategory): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}
