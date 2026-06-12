'use client';

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
  CardAction,
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
import { Field, FieldError, FieldLabel, FieldSet } from '@repo/design-system/components/ui/field';
import { Input } from '@repo/design-system/components/ui/input';
import { Separator } from '@repo/design-system/components/ui/separator';
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
import { useDeferredValue, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import type {
  AdminSkill,
  AdminBulkOperationResponse,
  AdminSkillPayload,
  AdminSkillResource,
  AdminSkillResourcePayload,
  AdminSkillsListResponse,
  ResourceType,
  RoleCategory,
} from '@/types/admin-content';

import { adminContentService, getApiErrorMessage } from '@/services/admin-content.service';
import {
  adminResourceFormSchema,
  adminSkillFormSchema,
  RESOURCE_TYPE_VALUES,
  ROLE_CATEGORY_VALUES,
  type AdminResourceFormValues,
  type AdminSkillFormValues,
} from '@/validations/admin-content.schema';

import { AdminPagination } from '../../_components/admin-pagination';
import { DraftRecoveryNotice } from '../../_components/draft-recovery-notice';
import { useDrawerDraft } from '../../_components/use-drawer-draft';

const DEFAULT_PER_PAGE = 10;
const EMPTY_SKILLS: AdminSkill[] = [];

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

type RoleFilter = '' | RoleCategory;

type SkillDrawerState =
  | {
      mode: 'create';
      skill?: undefined;
    }
  | {
      mode: 'edit';
      skill: AdminSkill;
    };

type ResourceDrawerState =
  | {
      mode: 'create';
      resource?: undefined;
    }
  | {
      mode: 'edit';
      resource: AdminSkillResource;
    };

export function AdminSkillsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [skillsResponse, setSkillsResponse] = useState<AdminSkillsListResponse | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedBulkSkillIds, setSelectedBulkSkillIds] = useState<Set<string>>(new Set());
  const [bulkRoleCategory, setBulkRoleCategory] = useState<RoleCategory>('WEB_DEVELOPMENT');
  const [resources, setResources] = useState<AdminSkillResource[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [resourcesError, setResourcesError] = useState<string | null>(null);
  const [skillsRefreshKey, setSkillsRefreshKey] = useState(0);
  const [resourcesRefreshKey, setResourcesRefreshKey] = useState(0);
  const [skillDrawer, setSkillDrawer] = useState<SkillDrawerState | null>(null);
  const [resourceDrawer, setResourceDrawer] = useState<ResourceDrawerState | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<AdminSkill | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkApplying, setIsBulkApplying] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<AdminSkillResource | null>(null);
  const [isDeletingSkill, setIsDeletingSkill] = useState(false);
  const [isDeletingResource, setIsDeletingResource] = useState(false);
  const deferredSearchTerm = useDeferredValue(searchTerm.trim());

  const skills = skillsResponse?.data ?? EMPTY_SKILLS;
  const skillsMeta = skillsResponse?.meta;
  const selectedSkill = skills.find((skill) => skill.id === selectedSkillId) ?? null;
  const primaryResourceCount = resources.filter((resource) => resource.isPrimary).length;
  const isSearchDeferred = deferredSearchTerm !== searchTerm.trim();
  const isUpdatingSkills = (isLoadingSkills || isSearchDeferred) && skillsResponse !== null;
  const selectedBulkIds = Array.from(selectedBulkSkillIds);
  const isCurrentPageSelected =
    skills.length > 0 && skills.every((skill) => selectedBulkSkillIds.has(skill.id));

  useEffect(() => {
    let isCurrent = true;

    setIsLoadingSkills(true);
    setSkillsError(null);

    void adminContentService
      .listSkills({
        page,
        perPage,
        q: deferredSearchTerm || undefined,
        roleCategory: roleFilter || undefined,
      })
      .then((response) => {
        if (!isCurrent) return;
        setSkillsResponse(response);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setSkillsResponse(null);
        setSkillsError(getApiErrorMessage(error, 'Unable to load skills.'));
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingSkills(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [deferredSearchTerm, page, perPage, roleFilter, skillsRefreshKey]);

  useEffect(() => {
    if (skills.length === 0) {
      setSelectedSkillId(null);
      return;
    }

    if (!selectedSkillId || !skills.some((skill) => skill.id === selectedSkillId)) {
      setSelectedSkillId(skills[0]?.id ?? null);
    }
  }, [selectedSkillId, skills]);

  useEffect(() => {
    if (!selectedSkillId) {
      setResources([]);
      setResourcesError(null);
      return;
    }

    let isCurrent = true;

    setIsLoadingResources(true);
    setResourcesError(null);

    void adminContentService
      .listResources(selectedSkillId)
      .then((response) => {
        if (!isCurrent) return;
        setResources(response.resources);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setResources([]);
        setResourcesError(getApiErrorMessage(error, 'Unable to load resources.'));
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingResources(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [resourcesRefreshKey, selectedSkillId]);

  const refreshSkills = () => {
    setSkillsRefreshKey((current) => current + 1);
  };

  const refreshResources = () => {
    setResourcesRefreshKey((current) => current + 1);
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
    setSelectedBulkSkillIds((current) => {
      const next = new Set(current);

      for (const skill of skills) {
        if (checked) {
          next.add(skill.id);
        } else {
          next.delete(skill.id);
        }
      }

      return next;
    });
  };

  const handleToggleSkillSelection = (skillId: string, checked: boolean) => {
    setSelectedBulkSkillIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(skillId);
      } else {
        next.delete(skillId);
      }

      return next;
    });
  };

  const handleBulkCategoryUpdate = async () => {
    if (selectedBulkIds.length === 0) return;

    setIsBulkApplying(true);

    try {
      const result = await adminContentService.bulkUpdateSkillCategory(
        selectedBulkIds,
        bulkRoleCategory,
      );
      reportBulkResult('Skill category update', result);
      refreshSkills();
    } catch (error) {
      toast.error('Bulk category update failed', {
        description: getApiErrorMessage(error, 'Unable to update selected skills.'),
      });
    } finally {
      setIsBulkApplying(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBulkIds.length === 0) return;

    setIsBulkApplying(true);

    try {
      const result = await adminContentService.bulkDeleteSkills(selectedBulkIds);
      reportBulkResult('Skill bulk delete', result);
      setSelectedBulkSkillIds((current) => {
        const next = new Set(current);

        for (const skillId of result.succeeded) {
          next.delete(skillId);
        }

        return next;
      });
      setIsBulkDeleteOpen(false);
      refreshSkills();
    } catch (error) {
      toast.error('Bulk deletion failed', {
        description: getApiErrorMessage(error, 'Unable to delete selected skills.'),
      });
    } finally {
      setIsBulkApplying(false);
    }
  };

  const handleSubmitSkill = async (payload: AdminSkillPayload, skill?: AdminSkill) => {
    const savedSkill = skill
      ? await adminContentService.updateSkill(skill.id, payload)
      : await adminContentService.createSkill(payload);

    setSelectedSkillId(savedSkill.id);
    refreshSkills();
    toast.success(skill ? 'Skill updated' : 'Skill created');
  };

  const handleSubmitResource = async (
    payload: AdminSkillResourcePayload,
    resource?: AdminSkillResource,
  ) => {
    if (!selectedSkill) return;

    if (resource) {
      await adminContentService.updateResource(selectedSkill.id, resource.id, payload);
      toast.success('Resource updated');
    } else {
      await adminContentService.createResource(selectedSkill.id, payload);
      toast.success('Resource created');
    }

    refreshResources();
  };

  const handleDeleteSkill = async () => {
    if (!skillToDelete) return;

    setIsDeletingSkill(true);

    try {
      await adminContentService.deleteSkill(skillToDelete.id);
      toast.success('Skill deleted');
      setSkillToDelete(null);
      refreshSkills();
    } catch (error) {
      toast.error('Skill deletion blocked', {
        description: getApiErrorMessage(error, 'Unable to delete this skill.'),
      });
    } finally {
      setIsDeletingSkill(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!selectedSkill || !resourceToDelete) return;

    setIsDeletingResource(true);

    try {
      await adminContentService.deleteResource(selectedSkill.id, resourceToDelete.id);
      toast.success('Resource deleted');
      setResourceToDelete(null);
      refreshResources();
    } catch (error) {
      toast.error('Resource deletion failed', {
        description: getApiErrorMessage(error, 'Unable to delete this resource.'),
      });
    } finally {
      setIsDeletingResource(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <section className="border-border/70 bg-card/90 rounded-3xl border p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex max-w-3xl flex-col gap-2">
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-foreground text-3xl leading-tight sm:text-4xl">
                Skills and resources
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Manage course-scope skill records and keep resource lists scoped to the selected
                skill.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refreshSkills()}>
              Refresh
            </Button>
            <Button onClick={() => setSkillDrawer({ mode: 'create' })}>Create skill</Button>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <Card className="bg-card/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Skill catalog</CardTitle>
            <CardDescription>
              Search by name and filter by role category. Selecting a row loads its resources.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
              <Field>
                <FieldLabel className="sr-only" htmlFor="skill-search">
                  Search skills
                </FieldLabel>
                <Input
                  id="skill-search"
                  placeholder="Search skills..."
                  value={searchTerm}
                  onChange={(event) => handleSearchChange(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel className="sr-only" htmlFor="role-filter">
                  Filter by role category
                </FieldLabel>
                <NativeSelect
                  id="role-filter"
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

            {skillsError ? (
              <InlineNotice title="Skills unavailable" tone="error" description={skillsError} />
            ) : null}

            {isUpdatingSkills ? (
              <InlineNotice
                title="Updating results"
                description="Keeping the current skill list visible while the latest filters load."
              />
            ) : null}

            {selectedBulkIds.length > 0 ? (
              <div className="border-border/80 bg-muted/30 flex flex-col gap-3 rounded-2xl border p-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{selectedBulkIds.length} skills selected</p>
                  <p className="text-muted-foreground text-xs">
                    Batch delete or assign a role category to selected skills.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Field className="min-w-56">
                    <FieldLabel className="text-xs" htmlFor="bulk-skill-category">
                      Category
                    </FieldLabel>
                    <NativeSelect
                      id="bulk-skill-category"
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
                        disabled={skills.length === 0 || isLoadingSkills}
                        aria-label="Select all skills on this page"
                        checked={isCurrentPageSelected}
                        onCheckedChange={(checked) => handleToggleCurrentPage(checked === true)}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingSkills && !skillsResponse ? (
                    <TablePlaceholder rows={5} colSpan={6} />
                  ) : skills.length > 0 ? (
                    skills.map((skill) => (
                      <TableRow
                        key={skill.id}
                        className="cursor-pointer"
                        role="button"
                        tabIndex={0}
                        data-state={skill.id === selectedSkillId ? 'selected' : undefined}
                        onKeyDown={(event) => {
                          if (isActivationKey(event.key)) {
                            event.preventDefault();
                            setSelectedSkillId(skill.id);
                          }
                        }}
                        onClick={() => setSelectedSkillId(skill.id)}
                      >
                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            aria-label={`Select ${skill.name}`}
                            checked={selectedBulkSkillIds.has(skill.id)}
                            onCheckedChange={(checked) =>
                              handleToggleSkillSelection(skill.id, checked === true)
                            }
                          />
                        </TableCell>
                        <TableCell className="min-w-64 whitespace-normal">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{skill.name}</span>
                            <span className="text-muted-foreground line-clamp-2 text-xs">
                              {skill.description || 'No description yet.'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {skill.roleCategory ? formatEnumLabel(skill.roleCategory) : 'None'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatHours(skill.defaultEstimatedHours)}</TableCell>
                        <TableCell>{formatDate(skill.updatedAt)}</TableCell>
                        <TableCell>
                          <div
                            className="flex justify-end gap-2"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSkillDrawer({ mode: 'edit', skill })}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setSkillToDelete(skill)}
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
                        No skills match the current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {skillsMeta ? (
              <AdminPagination
                isLoading={isLoadingSkills}
                page={page}
                pageSize={perPage}
                total={skillsMeta.total}
                totalPages={skillsMeta.totalPages}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur-md lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <CardHeader>
            <CardTitle>Selected-skill resources</CardTitle>
            <CardDescription>
              Resources are loaded and mutated only for the selected skill.
            </CardDescription>
            <CardAction>
              <Button
                size="sm"
                disabled={!selectedSkill}
                onClick={() => setResourceDrawer({ mode: 'create' })}
              >
                Add resource
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {selectedSkill ? (
              <div className="bg-muted/30 rounded-2xl border p-4">
                <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
                  Selected skill
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  <h2 className="font-heading text-xl">{selectedSkill.name}</h2>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {selectedSkill.roleCategory
                        ? formatEnumLabel(selectedSkill.roleCategory)
                        : 'No category'}
                    </Badge>
                    <Badge variant="outline">{primaryResourceCount}/2 primary resources</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <InlineNotice
                title="No skill selected"
                description="Select a skill from the table to manage its resources."
              />
            )}

            {resourcesError ? (
              <InlineNotice
                title="Resources unavailable"
                tone="error"
                description={resourcesError}
              />
            ) : null}

            {selectedSkill && primaryResourceCount >= 2 ? (
              <InlineNotice
                title="Primary limit reached"
                description="The API rejects additional primary resources until one primary resource is unmarked or deleted."
              />
            ) : null}

            <div className="flex flex-col gap-3">
              {isLoadingResources ? (
                <ResourcePlaceholder />
              ) : resources.length > 0 ? (
                resources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onDelete={() => setResourceToDelete(resource)}
                    onEdit={() => setResourceDrawer({ mode: 'edit', resource })}
                  />
                ))
              ) : selectedSkill ? (
                <InlineNotice
                  title="No resources yet"
                  description="Add a resource to this skill before it appears in roadmap node details."
                />
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <SkillFormDrawer
        drawer={skillDrawer}
        onOpenChange={(open) => {
          if (!open) setSkillDrawer(null);
        }}
        onSubmit={handleSubmitSkill}
      />

      <ResourceFormDrawer
        drawer={resourceDrawer}
        selectedSkill={selectedSkill}
        onOpenChange={(open) => {
          if (!open) setResourceDrawer(null);
        }}
        onSubmit={handleSubmitResource}
      />

      <ConfirmDeleteDialog
        title="Delete skill"
        confirmLabel="Delete skill"
        description={
          skillToDelete
            ? `Delete "${skillToDelete.name}"? The API will block deletion if roadmap or template nodes reference this skill.`
            : ''
        }
        isDeleting={isDeletingSkill}
        onConfirm={handleDeleteSkill}
        open={!!skillToDelete}
        onOpenChange={(open) => {
          if (!open) setSkillToDelete(null);
        }}
      />

      <ConfirmDeleteDialog
        title="Delete selected skills"
        confirmLabel="Delete selected"
        description={`Delete ${selectedBulkIds.length} selected skills? The API will report any skills blocked by roadmap or template references.`}
        isDeleting={isBulkApplying}
        onConfirm={handleBulkDelete}
        open={isBulkDeleteOpen}
        onOpenChange={(open) => setIsBulkDeleteOpen(open)}
      />

      <ConfirmDeleteDialog
        title="Delete resource"
        confirmLabel="Delete resource"
        description={
          resourceToDelete ? `Delete "${resourceToDelete.title}" from the selected skill?` : ''
        }
        isDeleting={isDeletingResource}
        onConfirm={handleDeleteResource}
        open={!!resourceToDelete}
        onOpenChange={(open) => {
          if (!open) setResourceToDelete(null);
        }}
      />
    </div>
  );
}

function SkillFormDrawer({
  drawer,
  onOpenChange,
  onSubmit,
}: {
  drawer: SkillDrawerState | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AdminSkillPayload, skill?: AdminSkill) => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const skill = drawer?.skill;
  const defaultValues = getSkillFormDefaults(skill);
  const form = useForm<AdminSkillFormValues>({
    defaultValues,
    resolver: zodResolver(adminSkillFormSchema),
  });
  const errors = form.formState.errors;
  const isOpen = !!drawer;
  const draft = useDrawerDraft({
    defaultValues,
    form,
    isOpen,
    storageKey: `admin:skill:${skill?.id ?? 'create'}`,
  });
  const handleDiscardDraft = () => draft.discardDraft();
  const handleRestoreDraft = () => draft.restoreDraft();

  useEffect(() => {
    if (isOpen) {
      form.reset(getSkillFormDefaults(skill));
    }
  }, [form, isOpen, skill]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);

    try {
      await onSubmit(toSkillPayload(values), skill);
      draft.clearDraft();
      onOpenChange(false);
    } catch (error) {
      toast.error(skill ? 'Skill update failed' : 'Skill creation failed', {
        description: getApiErrorMessage(error, 'Please check the skill details and try again.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Drawer direction="right" open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-xl">
        <form className="relative flex min-h-0 flex-1 flex-col" noValidate onSubmit={handleSubmit}>
          <DrawerSubmitOverlay label="Saving skill" isVisible={isSubmitting} />
          <DrawerHeader>
            <DrawerTitle>{skill ? 'Edit skill' : 'Create skill'}</DrawerTitle>
            <DrawerDescription>
              Skill records drive roadmap node metadata and resource ownership.
            </DrawerDescription>
            {draft.hasDraft ? (
              <DraftRecoveryNotice onDiscard={handleDiscardDraft} onRestore={handleRestoreDraft} />
            ) : null}
          </DrawerHeader>
          <div className="scrollbar-thin flex-1 overflow-y-auto px-4">
            <FieldSet disabled={isSubmitting}>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="skill-name">Name</FieldLabel>
                <Input id="skill-name" aria-invalid={!!errors.name} {...form.register('name')} />
                <FieldError errors={[errors.name]} />
              </Field>

              <Field data-invalid={!!errors.roleCategory}>
                <FieldLabel htmlFor="skill-role-category">Role category</FieldLabel>
                <NativeSelect
                  id="skill-role-category"
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

              <Field data-invalid={!!errors.defaultEstimatedHours}>
                <FieldLabel htmlFor="skill-hours">Default estimated hours</FieldLabel>
                <Input
                  id="skill-hours"
                  placeholder="Optional"
                  inputMode="decimal"
                  aria-invalid={!!errors.defaultEstimatedHours}
                  {...form.register('defaultEstimatedHours')}
                />
                <FieldError errors={[errors.defaultEstimatedHours]} />
              </Field>

              <Field data-invalid={!!errors.description}>
                <FieldLabel htmlFor="skill-description">Description</FieldLabel>
                <TextareaControl
                  id="skill-description"
                  placeholder="What should learners know about this skill?"
                  aria-invalid={!!errors.description}
                  rows={6}
                  {...form.register('description')}
                />
                <FieldError errors={[errors.description]} />
              </Field>
            </FieldSet>
          </div>
          <DrawerFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save skill'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button" disabled={isSubmitting}>
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

function ResourceFormDrawer({
  drawer,
  onOpenChange,
  onSubmit,
  selectedSkill,
}: {
  drawer: ResourceDrawerState | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AdminSkillResourcePayload, resource?: AdminSkillResource) => Promise<void>;
  selectedSkill: AdminSkill | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resource = drawer?.resource;
  const defaultValues = getResourceFormDefaults(resource);
  const form = useForm<AdminResourceFormValues>({
    defaultValues,
    resolver: zodResolver(adminResourceFormSchema),
  });
  const errors = form.formState.errors;
  const isOpen = !!drawer;
  const isFree = form.watch('isFree');
  const isPrimary = form.watch('isPrimary');
  const draft = useDrawerDraft({
    defaultValues,
    form,
    isOpen,
    storageKey: `admin:resource:${selectedSkill?.id ?? 'none'}:${resource?.id ?? 'create'}`,
  });
  const handleDiscardDraft = () => draft.discardDraft();
  const handleRestoreDraft = () => draft.restoreDraft();

  useEffect(() => {
    if (isOpen) {
      form.reset(getResourceFormDefaults(resource));
    }
  }, [form, isOpen, resource]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);

    try {
      await onSubmit(
        {
          isFree: values.isFree,
          isPrimary: values.isPrimary,
          resourceType: values.resourceType,
          title: values.title.trim(),
          url: values.url.trim(),
        },
        resource,
      );
      draft.clearDraft();
      onOpenChange(false);
    } catch (error) {
      toast.error(resource ? 'Resource update failed' : 'Resource creation failed', {
        description: getApiErrorMessage(error, 'Please check the resource details and try again.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Drawer direction="right" open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:max-w-xl">
        <form className="relative flex min-h-0 flex-1 flex-col" noValidate onSubmit={handleSubmit}>
          <DrawerSubmitOverlay label="Saving resource" isVisible={isSubmitting} />
          <DrawerHeader>
            <DrawerTitle>{resource ? 'Edit resource' : 'Create resource'}</DrawerTitle>
            <DrawerDescription>
              {selectedSkill
                ? `Resources will stay scoped to ${selectedSkill.name}.`
                : 'Select a skill before creating resources.'}
            </DrawerDescription>
            {draft.hasDraft ? (
              <DraftRecoveryNotice onDiscard={handleDiscardDraft} onRestore={handleRestoreDraft} />
            ) : null}
          </DrawerHeader>
          <div className="scrollbar-thin flex-1 overflow-y-auto px-4">
            <FieldSet disabled={isSubmitting}>
              <Field data-invalid={!!errors.title}>
                <FieldLabel htmlFor="resource-title">Title</FieldLabel>
                <Input
                  id="resource-title"
                  aria-invalid={!!errors.title}
                  {...form.register('title')}
                />
                <FieldError errors={[errors.title]} />
              </Field>

              <Field data-invalid={!!errors.url}>
                <FieldLabel htmlFor="resource-url">URL</FieldLabel>
                <Input
                  id="resource-url"
                  placeholder="https://example.com/resource"
                  aria-invalid={!!errors.url}
                  {...form.register('url')}
                />
                <FieldError errors={[errors.url]} />
              </Field>

              <Field data-invalid={!!errors.resourceType}>
                <FieldLabel htmlFor="resource-type">Resource type</FieldLabel>
                <NativeSelect
                  id="resource-type"
                  aria-invalid={!!errors.resourceType}
                  {...form.register('resourceType')}
                >
                  {RESOURCE_TYPE_VALUES.map((type) => (
                    <option key={type} value={type}>
                      {formatEnumLabel(type)}
                    </option>
                  ))}
                </NativeSelect>
                <FieldError errors={[errors.resourceType]} />
              </Field>

              <Field orientation="horizontal">
                <Checkbox
                  id="resource-free"
                  checked={isFree}
                  onCheckedChange={(checked) =>
                    form.setValue('isFree', checked === true, { shouldValidate: true })
                  }
                />
                <FieldLabel className="font-normal" htmlFor="resource-free">
                  Free resource
                </FieldLabel>
              </Field>

              <Field orientation="horizontal">
                <Checkbox
                  id="resource-primary"
                  checked={isPrimary}
                  onCheckedChange={(checked) =>
                    form.setValue('isPrimary', checked === true, { shouldValidate: true })
                  }
                />
                <FieldLabel className="font-normal" htmlFor="resource-primary">
                  Primary resource
                </FieldLabel>
              </Field>
            </FieldSet>
          </div>
          <DrawerFooter>
            <Button type="submit" disabled={isSubmitting || !selectedSkill}>
              {isSubmitting ? 'Saving...' : 'Save resource'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button" disabled={isSubmitting}>
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

function ResourceCard({
  onDelete,
  onEdit,
  resource,
}: {
  onDelete: () => void;
  onEdit: () => void;
  resource: AdminSkillResource;
}) {
  return (
    <article className="border-border/80 bg-background/75 rounded-2xl border p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="font-medium">{resource.title}</h3>
            <a
              className="text-muted-foreground hover:text-primary mt-1 block truncate text-sm"
              href={resource.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {resource.url}
            </a>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              Edit
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{formatEnumLabel(resource.resourceType)}</Badge>
          {resource.isPrimary ? <Badge variant="outline">Primary</Badge> : null}
          {resource.isFree ? (
            <Badge variant="outline">Free</Badge>
          ) : (
            <Badge variant="outline">Paid</Badge>
          )}
        </div>
      </div>
    </article>
  );
}

function ResourcePlaceholder() {
  return Array.from({ length: 3 }).map((_, index) => (
    <div key={index} className="border-border rounded-2xl border p-4">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <Skeleton className="h-4 w-1/2 rounded-full" />
        <Separator />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  ));
}

function getSkillFormDefaults(skill?: AdminSkill): AdminSkillFormValues {
  return {
    defaultEstimatedHours:
      skill?.defaultEstimatedHours === null || skill?.defaultEstimatedHours === undefined
        ? ''
        : String(skill.defaultEstimatedHours),
    description: skill?.description ?? '',
    name: skill?.name ?? '',
    roleCategory: skill?.roleCategory ?? 'WEB_DEVELOPMENT',
  };
}

function getResourceFormDefaults(resource?: AdminSkillResource): AdminResourceFormValues {
  return {
    isFree: resource?.isFree ?? true,
    isPrimary: resource?.isPrimary ?? false,
    resourceType: resource?.resourceType ?? 'DOCS',
    title: resource?.title ?? '',
    url: resource?.url ?? '',
  };
}

function toSkillPayload(values: AdminSkillFormValues): AdminSkillPayload {
  const description = values.description.trim();
  const defaultEstimatedHours = values.defaultEstimatedHours.trim();

  return {
    defaultEstimatedHours: defaultEstimatedHours ? Number(defaultEstimatedHours) : null,
    description: description || null,
    name: values.name.trim(),
    roleCategory: values.roleCategory,
  };
}

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 'Unknown' : DATE_FORMATTER.format(date);
}

function formatEnumLabel(value: ResourceType | RoleCategory): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}

function formatHours(value: null | number): string {
  if (value === null) {
    return 'Not set';
  }

  return `${value}h`;
}

function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ';
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
