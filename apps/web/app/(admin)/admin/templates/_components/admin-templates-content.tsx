'use client';

import type { Route } from 'next';

import { zodResolver } from '@hookform/resolvers/zod';
import { ConfirmDeleteDialog } from '@repo/design-system/components/common/confirm-delete-dialog';
import { DrawerSubmitOverlay } from '@repo/design-system/components/common/drawer-submit-overlay';
import { InlineNotice } from '@repo/design-system/components/common/inline-notice';
import { NativeSelect } from '@repo/design-system/components/common/native-select';
import { TablePlaceholder } from '@repo/design-system/components/common/table-placeholder';
import { TextareaControl } from '@repo/design-system/components/common/textarea-control';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import { toast } from '@repo/design-system/lib/toast';
import Link from 'next/link';
import { useDeferredValue, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import type {
  AdminTemplate,
  AdminBulkOperationResponse,
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

import { AdminPagination } from '../../_components/admin-pagination';

const DEFAULT_PER_PAGE = 10;
const EMPTY_TEMPLATES: AdminTemplate[] = [];

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

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
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [selectedBulkTemplateIds, setSelectedBulkTemplateIds] = useState<Set<string>>(new Set());
  const [bulkRoleCategory, setBulkRoleCategory] = useState<RoleCategory>('WEB_DEVELOPMENT');
  const [templatesResponse, setTemplatesResponse] = useState<AdminTemplatesListResponse | null>(
    null,
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [templatesRefreshKey, setTemplatesRefreshKey] = useState(0);
  const [templateDrawer, setTemplateDrawer] = useState<TemplateDrawerState | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<AdminTemplate | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkApplying, setIsBulkApplying] = useState(false);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm.trim());

  const templates = templatesResponse?.data ?? EMPTY_TEMPLATES;
  const templatesMeta = templatesResponse?.meta;
  const isSearchDeferred = deferredSearchTerm !== searchTerm.trim();
  const isUpdatingTemplates =
    (isLoadingTemplates || isSearchDeferred) && templatesResponse !== null;
  const selectedBulkIds = Array.from(selectedBulkTemplateIds);
  const isCurrentPageSelected =
    templates.length > 0 && templates.every((template) => selectedBulkTemplateIds.has(template.id));

  useEffect(() => {
    let isCurrent = true;

    setIsLoadingTemplates(true);
    setTemplatesError(null);

    void adminContentService
      .listTemplates({
        page,
        perPage,
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
  }, [deferredSearchTerm, page, perPage, roleFilter, templatesRefreshKey]);

  useEffect(() => {
    if (templates.length === 0) {
      setSelectedTemplateId(null);
      return;
    }

    if (!selectedTemplateId || !templates.some((template) => template.id === selectedTemplateId)) {
      setSelectedTemplateId(templates[0]?.id ?? null);
    }
  }, [selectedTemplateId, templates]);

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

  const handlePageSizeChange = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  const handleToggleCurrentPage = (checked: boolean) => {
    setSelectedBulkTemplateIds((current) => {
      const next = new Set(current);

      for (const template of templates) {
        if (checked) {
          next.add(template.id);
        } else {
          next.delete(template.id);
        }
      }

      return next;
    });
  };

  const handleToggleTemplateSelection = (templateId: string, checked: boolean) => {
    setSelectedBulkTemplateIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(templateId);
      } else {
        next.delete(templateId);
      }

      return next;
    });
  };

  const handleBulkCategoryUpdate = async () => {
    if (selectedBulkIds.length === 0) return;

    setIsBulkApplying(true);

    try {
      const result = await adminContentService.bulkUpdateTemplateCategory(
        selectedBulkIds,
        bulkRoleCategory,
      );
      reportBulkResult('Template category update', result);
      refreshTemplates();
    } catch (error) {
      toast.error('Bulk category update failed', {
        description: getApiErrorMessage(error, 'Unable to update selected templates.'),
      });
    } finally {
      setIsBulkApplying(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBulkIds.length === 0) return;

    setIsBulkApplying(true);

    try {
      const result = await adminContentService.bulkDeleteTemplates(selectedBulkIds);
      reportBulkResult('Template bulk delete', result);
      setSelectedBulkTemplateIds((current) => {
        const next = new Set(current);

        for (const templateId of result.succeeded) {
          next.delete(templateId);
        }

        return next;
      });
      setIsBulkDeleteOpen(false);
      refreshTemplates();
    } catch (error) {
      toast.error('Bulk deletion failed', {
        description: getApiErrorMessage(error, 'Unable to delete selected templates.'),
      });
    } finally {
      setIsBulkApplying(false);
    }
  };

  const handleSubmitTemplate = async (payload: AdminTemplatePayload, template?: AdminTemplate) => {
    const savedTemplate = template
      ? await adminContentService.updateTemplate(template.id, payload)
      : await adminContentService.createTemplate(payload);

    if (template) {
      toast.success('Template updated');
    } else {
      toast.success('Template created');
    }

    setSelectedTemplateId(savedTemplate.id);
    refreshTemplates();
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    setIsDeletingTemplate(true);

    try {
      await adminContentService.deleteTemplate(templateToDelete.id);
      toast.success('Template deleted');
      if (templateToDelete.id === selectedTemplateId) {
        setSelectedTemplateId(null);
      }
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
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-foreground text-3xl leading-tight sm:text-4xl">
                Roadmap templates
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Manage template metadata for the public roadmap catalog. Open a template to edit its
                grouped node list.
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

          {isUpdatingTemplates ? (
            <InlineNotice
              title="Updating results"
              description="Keeping the current template list visible while the latest filters load."
            />
          ) : null}

          {selectedBulkIds.length > 0 ? (
            <div className="border-border/80 bg-muted/30 flex flex-col gap-3 rounded-2xl border p-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{selectedBulkIds.length} templates selected</p>
                <p className="text-muted-foreground text-xs">
                  Batch delete or assign a role category to selected templates.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <Field className="min-w-56">
                  <FieldLabel className="text-xs" htmlFor="bulk-template-category">
                    Category
                  </FieldLabel>
                  <NativeSelect
                    id="bulk-template-category"
                    disabled={isBulkApplying}
                    value={bulkRoleCategory}
                    onChange={(event) => setBulkRoleCategory(event.target.value as RoleCategory)}
                  >
                    {ROLE_CATEGORY_VALUES.map((category) => (
                      <option key={category} value={category}>
                        {formatEnumLabel(category)}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Button
                  variant="outline"
                  disabled={isBulkApplying}
                  onClick={() => void handleBulkCategoryUpdate()}
                >
                  Apply category
                </Button>
                <Button
                  variant="destructive"
                  disabled={isBulkApplying}
                  onClick={() => setIsBulkDeleteOpen(true)}
                >
                  Delete selected
                </Button>
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      disabled={templates.length === 0 || isLoadingTemplates}
                      aria-label="Select all templates on this page"
                      checked={isCurrentPageSelected}
                      onCheckedChange={(checked) => handleToggleCurrentPage(checked === true)}
                    />
                  </TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Weeks</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTemplates && !templatesResponse ? (
                  <TablePlaceholder rows={5} colSpan={6} />
                ) : templates.length > 0 ? (
                  templates.map((template) => (
                    <TableRow
                      key={template.id}
                      className="cursor-pointer"
                      data-state={template.id === selectedTemplateId ? 'selected' : undefined}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          aria-label={`Select ${template.title}`}
                          checked={selectedBulkTemplateIds.has(template.id)}
                          onCheckedChange={(checked) =>
                            handleToggleTemplateSelection(template.id, checked === true)
                          }
                        />
                      </TableCell>
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
                        <div
                          className="flex flex-wrap justify-end gap-2"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            render={
                              <Link href={`/admin/templates/${template.id}` as Route<string>}>
                                Manage nodes
                              </Link>
                            }
                          />
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
                    <TableCell className="text-muted-foreground h-32 text-center" colSpan={6}>
                      No templates match the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {templatesMeta ? (
            <AdminPagination
              isLoading={isLoadingTemplates}
              page={page}
              pageSize={perPage}
              total={templatesMeta.total}
              totalPages={templatesMeta.totalPages}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
            />
          ) : null}
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
        title="Delete selected templates"
        confirmLabel="Delete selected"
        description={`Delete ${selectedBulkIds.length} selected templates? Template nodes are removed with each successful template deletion.`}
        isDeleting={isBulkApplying}
        onConfirm={handleBulkDelete}
        open={isBulkDeleteOpen}
        onOpenChange={(open) => setIsBulkDeleteOpen(open)}
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
        <form className="relative flex min-h-0 flex-1 flex-col" noValidate onSubmit={handleSubmit}>
          <DrawerSubmitOverlay label="Saving template" isVisible={isSubmitting} />
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

function reportBulkResult(action: string, result: AdminBulkOperationResponse): void {
  const summary = `${result.succeeded.length} succeeded, ${result.failed.length} failed.`;

  if (result.failed.length === 0) {
    toast.success(action, { description: summary });
    return;
  }

  const firstFailure = result.failed[0];

  toast.warning(action, {
    description: firstFailure ? `${summary} First failure: ${firstFailure.message}` : summary,
  });
}
