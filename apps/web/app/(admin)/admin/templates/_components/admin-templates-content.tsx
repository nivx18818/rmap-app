'use client';

import type { ComponentProps } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@repo/design-system/components/ui/drawer';
import { Field, FieldError, FieldGroup, FieldLabel } from '@repo/design-system/components/ui/field';
import { Input } from '@repo/design-system/components/ui/input';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import { toast } from '@repo/design-system/lib/toast';
import { cn } from '@repo/design-system/lib/utils';
import { useDeferredValue, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import type {
  AdminTemplate,
  AdminTemplatePayload,
  AdminTemplatesListResponse,
  RoleCategory,
} from '@/types/admin-content';

import { adminContentService, getApiErrorMessage } from '@/services/admin-content.service';
import {
  adminTemplateFormSchema,
  ROLE_CATEGORY_VALUES,
  type AdminTemplateFormValues,
} from '@/validations/admin-content.schema';

const PER_PAGE = 10;
const EMPTY_TEMPLATES: AdminTemplate[] = [];

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const CONTROL_CLASS_NAME =
  'border-border focus-visible:border-border bg-background text-foreground disabled:border-disabled disabled:bg-background disabled:text-disabled disabled:placeholder:text-disabled placeholder:text-muted-foreground/70 focus-visible:ring-ring min-h-10 w-full min-w-0 rounded-md border px-3 py-2.5 text-base shadow-[0_1px_2px_0_rgba(139,92,246,0.10)] transition-all outline-none focus-visible:shadow-none focus-visible:ring-2 disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20';

type RoleFilter = '' | RoleCategory;

type TemplateDrawerState =
  | {
      mode: 'create';
      template?: undefined;
    }
  | {
      mode: 'edit';
      template: AdminTemplate;
    };

export function AdminTemplatesContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('');
  const [page, setPage] = useState(1);
  const [templatesResponse, setTemplatesResponse] = useState<AdminTemplatesListResponse | null>(
    null,
  );
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [templatesRefreshKey, setTemplatesRefreshKey] = useState(0);
  const [templateDrawer, setTemplateDrawer] = useState<TemplateDrawerState | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<AdminTemplate | null>(null);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm.trim());

  const templates = templatesResponse?.data ?? EMPTY_TEMPLATES;
  const templatesMeta = templatesResponse?.meta;

  useEffect(() => {
    let isCurrent = true;

    setIsLoadingTemplates(true);
    setTemplatesError(null);

    void adminContentService
      .listTemplates({
        page,
        perPage: PER_PAGE,
        q: deferredSearchTerm || undefined,
        roleCategory: roleFilter || undefined,
      })
      .then((response) => {
        if (!isCurrent) return;
        setTemplatesResponse(response);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setTemplatesResponse(null);
        setTemplatesError(getApiErrorMessage(error, 'Unable to load templates.'));
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingTemplates(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [deferredSearchTerm, page, roleFilter, templatesRefreshKey]);

  const refreshTemplates = () => {
    setTemplatesRefreshKey((current) => current + 1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleRoleFilterChange = (value: RoleFilter) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleSubmitTemplate = async (payload: AdminTemplatePayload, template?: AdminTemplate) => {
    if (template) {
      await adminContentService.updateTemplate(template.id, payload);
      toast.success('Template updated');
    } else {
      await adminContentService.createTemplate(payload);
      toast.success('Template created');
    }

    refreshTemplates();
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    setIsDeletingTemplate(true);

    try {
      await adminContentService.deleteTemplate(templateToDelete.id);
      toast.success('Template deleted');
      setTemplateToDelete(null);
      refreshTemplates();
    } catch (error) {
      toast.error('Template deletion failed', {
        description: getApiErrorMessage(error, 'Unable to delete this template.'),
      });
    } finally {
      setIsDeletingTemplate(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <section className="border-border/70 bg-card/90 rounded-3xl border p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex max-w-3xl flex-col gap-2">
            <Badge variant="outline" className="w-fit">
              Phase 2
            </Badge>
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-foreground text-3xl leading-tight sm:text-4xl">
                Roadmap templates
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Manage template metadata for the public roadmap catalog.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refreshTemplates()}>
              Refresh
            </Button>
            <Button onClick={() => setTemplateDrawer({ mode: 'create' })}>Create template</Button>
          </div>
        </div>
      </section>

      <Card className="bg-card/90 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Template catalog</CardTitle>
          <CardDescription>
            Empty templates are included so metadata can be prepared before node editing.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
            <Field>
              <FieldLabel className="sr-only" htmlFor="template-search">
                Search templates
              </FieldLabel>
              <Input
                id="template-search"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel className="sr-only" htmlFor="template-role-filter">
                Filter by role category
              </FieldLabel>
              <NativeSelect
                id="template-role-filter"
                value={roleFilter}
                onChange={(event) => handleRoleFilterChange(event.target.value as RoleFilter)}
              >
                <option value="">All role categories</option>
                {ROLE_CATEGORY_VALUES.map((category) => (
                  <option key={category} value={category}>
                    {formatEnumLabel(category)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          {templatesError ? (
            <InlineNotice title="Templates unavailable" tone="error" description={templatesError} />
          ) : null}

          <div className="overflow-hidden rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Weeks</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTemplates ? (
                  <TablePlaceholder rows={5} />
                ) : templates.length > 0 ? (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="min-w-72 whitespace-normal">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{template.title}</span>
                          <span className="text-muted-foreground line-clamp-2 text-xs">
                            {template.description || 'No description yet.'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{formatEnumLabel(template.roleCategory)}</Badge>
                      </TableCell>
                      <TableCell>{formatWeeks(template.estimatedWeeks)}</TableCell>
                      <TableCell>{formatDate(template.updatedAt)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTemplateDrawer({ mode: 'edit', template })}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setTemplateToDelete(template)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="text-muted-foreground h-32 text-center" colSpan={5}>
                      No templates match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              {templatesMeta
                ? `${templatesMeta.total} templates, page ${templatesMeta.page} of ${Math.max(templatesMeta.totalPages, 1)}`
                : 'Loading templates...'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isLoadingTemplates || page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  isLoadingTemplates ||
                  !templatesMeta ||
                  templatesMeta.totalPages === 0 ||
                  page >= templatesMeta.totalPages
                }
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TemplateFormDrawer
        drawer={templateDrawer}
        onOpenChange={(open) => {
          if (!open) setTemplateDrawer(null);
        }}
        onSubmit={handleSubmitTemplate}
      />

      <ConfirmDeleteDialog
        title="Delete template"
        confirmLabel="Delete template"
        description={
          templateToDelete
            ? `Delete "${templateToDelete.title}"? This also removes its template nodes.`
            : ''
        }
        isDeleting={isDeletingTemplate}
        onConfirm={handleDeleteTemplate}
        open={!!templateToDelete}
        onOpenChange={(open) => {
          if (!open) setTemplateToDelete(null);
        }}
      />
    </div>
  );
}

function TemplateFormDrawer({
  drawer,
  onOpenChange,
  onSubmit,
}: {
  drawer: TemplateDrawerState | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AdminTemplatePayload, template?: AdminTemplate) => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const template = drawer?.template;
  const form = useForm<AdminTemplateFormValues>({
    defaultValues: getTemplateFormDefaults(template),
    resolver: zodResolver(adminTemplateFormSchema),
  });
  const errors = form.formState.errors;
  const isOpen = !!drawer;

  useEffect(() => {
    if (isOpen) {
      form.reset(getTemplateFormDefaults(template));
    }
  }, [form, isOpen, template]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);

    try {
      await onSubmit(toTemplatePayload(values), template);
      onOpenChange(false);
    } catch (error) {
      toast.error(template ? 'Template update failed' : 'Template creation failed', {
        description: getApiErrorMessage(error, 'Please check the template details and try again.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Drawer direction="right" open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-xl">
        <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={handleSubmit}>
          <DrawerHeader>
            <DrawerTitle>{template ? 'Edit template' : 'Create template'}</DrawerTitle>
            <DrawerDescription>
              Metadata controls how templates appear in the catalog and recommendations.
            </DrawerDescription>
          </DrawerHeader>
          <div className="scrollbar-thin flex-1 overflow-y-auto px-4">
            <FieldGroup>
              <Field data-invalid={!!errors.title}>
                <FieldLabel htmlFor="template-title">Title</FieldLabel>
                <Input
                  id="template-title"
                  aria-invalid={!!errors.title}
                  {...form.register('title')}
                />
                <FieldError errors={[errors.title]} />
              </Field>

              <Field data-invalid={!!errors.roleCategory}>
                <FieldLabel htmlFor="template-role-category">Role category</FieldLabel>
                <NativeSelect
                  id="template-role-category"
                  aria-invalid={!!errors.roleCategory}
                  {...form.register('roleCategory')}
                >
                  {ROLE_CATEGORY_VALUES.map((category) => (
                    <option key={category} value={category}>
                      {formatEnumLabel(category)}
                    </option>
                  ))}
                </NativeSelect>
                <FieldError errors={[errors.roleCategory]} />
              </Field>

              <Field data-invalid={!!errors.estimatedWeeks}>
                <FieldLabel htmlFor="template-estimated-weeks">Estimated weeks</FieldLabel>
                <Input
                  id="template-estimated-weeks"
                  placeholder="Optional"
                  inputMode="numeric"
                  aria-invalid={!!errors.estimatedWeeks}
                  {...form.register('estimatedWeeks')}
                />
                <FieldError errors={[errors.estimatedWeeks]} />
              </Field>

              <Field data-invalid={!!errors.description}>
                <FieldLabel htmlFor="template-description">Description</FieldLabel>
                <TextareaControl
                  id="template-description"
                  placeholder="Describe the template path."
                  aria-invalid={!!errors.description}
                  rows={6}
                  {...form.register('description')}
                />
                <FieldError errors={[errors.description]} />
              </Field>
            </FieldGroup>
          </div>
          <DrawerFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save template'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

function ConfirmDeleteDialog({
  confirmLabel,
  description,
  isDeleting,
  onConfirm,
  onOpenChange,
  open,
  title,
}: {
  confirmLabel: string;
  description: string;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            type="button"
            disabled={isDeleting}
            onClick={() => {
              void onConfirm();
            }}
          >
            {isDeleting ? 'Deleting...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function InlineNotice({
  description,
  title,
  tone = 'default',
}: {
  description: string;
  title: string;
  tone?: 'default' | 'error';
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4',
        tone === 'error' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/30',
      )}
    >
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  );
}

function TablePlaceholder({ rows }: { rows: number }) {
  return Array.from({ length: rows }).map((_, index) => (
    <TableRow key={index}>
      <TableCell className="h-16" colSpan={5}>
        <Skeleton className="h-4 w-full max-w-180 rounded-full" />
      </TableCell>
    </TableRow>
  ));
}

function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(CONTROL_CLASS_NAME, className)} {...props} />;
}

function TextareaControl({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(CONTROL_CLASS_NAME, 'min-h-28 resize-y', className)} {...props} />;
}

function getTemplateFormDefaults(template?: AdminTemplate): AdminTemplateFormValues {
  return {
    description: template?.description ?? '',
    estimatedWeeks:
      template?.estimatedWeeks === null || template?.estimatedWeeks === undefined
        ? ''
        : String(template.estimatedWeeks),
    roleCategory: template?.roleCategory ?? 'WEB_DEVELOPMENT',
    title: template?.title ?? '',
  };
}

function toTemplatePayload(values: AdminTemplateFormValues): AdminTemplatePayload {
  const estimatedWeeks = values.estimatedWeeks.trim();

  return {
    description: values.description.trim(),
    estimatedWeeks: estimatedWeeks ? Number(estimatedWeeks) : null,
    roleCategory: values.roleCategory,
    title: values.title.trim(),
  };
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

function formatWeeks(value: null | number): string {
  if (value === null) {
    return 'Not set';
  }

  return `${value} week${value === 1 ? '' : 's'}`;
}
