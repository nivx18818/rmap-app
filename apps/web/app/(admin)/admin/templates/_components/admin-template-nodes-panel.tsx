'use client';

import type { ComponentProps } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
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
  CardAction,
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
import { Separator } from '@repo/design-system/components/ui/separator';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { toast } from '@repo/design-system/lib/toast';
import { cn } from '@repo/design-system/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import type {
  AdminSkill,
  AdminTemplate,
  AdminTemplateNode,
  AdminTemplateNodePayload,
  TemplateNodeType,
} from '@/types/admin-content';

import { adminContentService, getApiErrorMessage } from '@/services/admin-content.service';
import {
  adminTemplateNodeFormSchema,
  TEMPLATE_NODE_TYPE_VALUES,
  type AdminTemplateNodeFormValues,
} from '@/validations/admin-content.schema';

const EMPTY_NODES: AdminTemplateNode[] = [];
const EMPTY_SKILLS: AdminSkill[] = [];
const SKILL_OPTIONS_LIMIT = 100;
const CONTROL_CLASS_NAME =
  'border-border focus-visible:border-border bg-background text-foreground disabled:border-disabled disabled:bg-background disabled:text-disabled disabled:placeholder:text-disabled placeholder:text-muted-foreground/70 focus-visible:ring-ring min-h-10 w-full min-w-0 rounded-md border px-3 py-2.5 text-base shadow-[0_1px_2px_0_rgba(139,92,246,0.10)] transition-all outline-none focus-visible:shadow-none focus-visible:ring-2 disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20';

type NodeDrawerState =
  | {
      defaults?: Partial<AdminTemplateNodeFormValues>;
      mode: 'create';
      node?: undefined;
    }
  | {
      defaults?: undefined;
      mode: 'edit';
      node: AdminTemplateNode;
    };

interface TemplateNodeSection {
  children: AdminTemplateNode[];
  node: AdminTemplateNode;
}

interface AdminTemplateNodesPanelProps {
  selectedTemplate: AdminTemplate | null;
}

export function AdminTemplateNodesPanel({ selectedTemplate }: AdminTemplateNodesPanelProps) {
  const [nodes, setNodes] = useState<AdminTemplateNode[]>(EMPTY_NODES);
  const [skills, setSkills] = useState<AdminSkill[]>(EMPTY_SKILLS);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [nodesError, setNodesError] = useState<string | null>(null);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [nodesRefreshKey, setNodesRefreshKey] = useState(0);
  const [nodeDrawer, setNodeDrawer] = useState<NodeDrawerState | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<AdminTemplateNode | null>(null);
  const [isDeletingNode, setIsDeletingNode] = useState(false);
  const [openSectionIds, setOpenSectionIds] = useState<Set<string>>(new Set());

  const sections = useMemo(() => buildNodeSections(nodes), [nodes]);
  const orphanNodes = useMemo(() => getOrphanNodes(nodes), [nodes]);
  const leafNodeCount = nodes.filter((node) => isLeafNodeType(node.nodeType)).length;

  useEffect(() => {
    if (!selectedTemplate) {
      setNodes(EMPTY_NODES);
      setNodesError(null);
      return;
    }

    let isCurrent = true;

    setIsLoadingNodes(true);
    setNodesError(null);

    void adminContentService
      .listTemplateNodes(selectedTemplate.id)
      .then((response) => {
        if (!isCurrent) return;
        setNodes(response.nodes);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setNodes(EMPTY_NODES);
        setNodesError(getApiErrorMessage(error, 'Unable to load template nodes.'));
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingNodes(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [nodesRefreshKey, selectedTemplate]);

  useEffect(() => {
    setOpenSectionIds(new Set());
  }, [selectedTemplate?.id]);

  useEffect(() => {
    if (!selectedTemplate) {
      setSkills(EMPTY_SKILLS);
      setSkillsError(null);
      return;
    }

    let isCurrent = true;

    setIsLoadingSkills(true);
    setSkillsError(null);

    void adminContentService
      .listSkills({
        page: 1,
        perPage: SKILL_OPTIONS_LIMIT,
        roleCategory: selectedTemplate.roleCategory,
      })
      .then((response) => {
        if (!isCurrent) return;
        setSkills(response.data);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setSkills(EMPTY_SKILLS);
        setSkillsError(getApiErrorMessage(error, 'Unable to load skills for this template.'));
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingSkills(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedTemplate]);

  const refreshNodes = () => {
    setNodesRefreshKey((current) => current + 1);
  };

  const toggleSection = (sectionId: string) => {
    setOpenSectionIds((currentSectionIds) => {
      const nextSectionIds = new Set(currentSectionIds);

      if (nextSectionIds.has(sectionId)) {
        nextSectionIds.delete(sectionId);
      } else {
        nextSectionIds.add(sectionId);
      }

      return nextSectionIds;
    });
  };

  const handleSubmitNode = async (payload: AdminTemplateNodePayload, node?: AdminTemplateNode) => {
    if (!selectedTemplate) return;

    if (node) {
      await adminContentService.updateTemplateNode(selectedTemplate.id, node.id, payload);
      toast.success('Template node updated');
    } else {
      const createdNode = await adminContentService.createTemplateNode(
        selectedTemplate.id,
        payload,
      );

      if (createdNode.nodeType === 'GROUP' || createdNode.parentId) {
        setOpenSectionIds((currentSectionIds) => {
          const nextSectionIds = new Set(currentSectionIds);
          nextSectionIds.add(createdNode.parentId ?? createdNode.id);

          return nextSectionIds;
        });
      }

      toast.success('Template node created');
    }

    refreshNodes();
  };

  const handleDeleteNode = async () => {
    if (!selectedTemplate || !nodeToDelete) return;

    setIsDeletingNode(true);

    try {
      await adminContentService.deleteTemplateNode(selectedTemplate.id, nodeToDelete.id);
      toast.success('Template node deleted');
      setNodeToDelete(null);
      refreshNodes();
    } catch (error) {
      toast.error('Template node deletion failed', {
        description: getApiErrorMessage(error, 'Unable to delete this template node.'),
      });
    } finally {
      setIsDeletingNode(false);
    }
  };

  return (
    <Card className="bg-card/90 backdrop-blur-md">
      <CardHeader>
        <CardTitle>Node editor</CardTitle>
        <CardDescription>
          {selectedTemplate
            ? `Grouped editor for ${selectedTemplate.title}.`
            : 'Select a template to manage its grouped node list.'}
        </CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" disabled={!selectedTemplate} onClick={refreshNodes}>
            Refresh
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {selectedTemplate ? (
          <div className="bg-muted/30 rounded-2xl border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs tracking-[0.2em] uppercase">
                  Selected template
                </p>
                <h2 className="font-heading mt-2 text-xl">{selectedTemplate.title}</h2>
              </div>
              <Badge variant="secondary">{formatEnumLabel(selectedTemplate.roleCategory)}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">{sections.length} sections</Badge>
              <Badge variant="outline">{leafNodeCount} lessons</Badge>
            </div>
          </div>
        ) : (
          <InlineNotice
            title="No template selected"
            description="Select a template from the catalog to edit its nodes."
          />
        )}

        {nodesError ? (
          <InlineNotice title="Nodes unavailable" tone="error" description={nodesError} />
        ) : null}

        {skillsError ? (
          <InlineNotice title="Skills unavailable" tone="error" description={skillsError} />
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={!selectedTemplate}
            onClick={() => setNodeDrawer({ defaults: { nodeType: 'GROUP' }, mode: 'create' })}
          >
            Add group
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!selectedTemplate}
            onClick={() => setNodeDrawer({ defaults: { nodeType: 'MILESTONE' }, mode: 'create' })}
          >
            Add milestone
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {isLoadingNodes ? (
            <NodeListPlaceholder />
          ) : sections.length > 0 ? (
            sections.map((section) => (
              <NodeSectionCard
                key={section.node.id}
                isOpen={
                  section.node.nodeType === 'MILESTONE' || openSectionIds.has(section.node.id)
                }
                section={section}
                skills={skills}
                onAddChild={() =>
                  setNodeDrawer({
                    defaults: {
                      nodeType: 'REQUIRED',
                      parentId: section.node.id,
                    },
                    mode: 'create',
                  })
                }
                onDeleteNode={setNodeToDelete}
                onEditNode={(node) => setNodeDrawer({ mode: 'edit', node })}
                onToggleSection={() => toggleSection(section.node.id)}
              />
            ))
          ) : selectedTemplate ? (
            <InlineNotice
              title="No nodes yet"
              description="Create a group or milestone section, then add required or optional skills under it."
            />
          ) : null}

          {orphanNodes.length > 0 ? (
            <OrphanNodesList
              nodes={orphanNodes}
              skills={skills}
              onDeleteNode={setNodeToDelete}
              onEditNode={(node) => setNodeDrawer({ mode: 'edit', node })}
            />
          ) : null}
        </div>
      </CardContent>

      <TemplateNodeFormDrawer
        drawer={nodeDrawer}
        isLoadingSkills={isLoadingSkills}
        nodes={nodes}
        skills={skills}
        template={selectedTemplate}
        onOpenChange={(open) => {
          if (!open) setNodeDrawer(null);
        }}
        onSubmit={handleSubmitNode}
      />

      <ConfirmDeleteDialog
        title="Delete template node"
        confirmLabel="Delete node"
        description={getDeleteDescription(nodeToDelete)}
        isDeleting={isDeletingNode}
        onConfirm={handleDeleteNode}
        open={!!nodeToDelete}
        onOpenChange={(open) => {
          if (!open) setNodeToDelete(null);
        }}
      />
    </Card>
  );
}

function NodeSectionCard({
  isOpen,
  onAddChild,
  onDeleteNode,
  onEditNode,
  onToggleSection,
  section,
  skills,
}: {
  isOpen: boolean;
  onAddChild: () => void;
  onDeleteNode: (node: AdminTemplateNode) => void;
  onEditNode: (node: AdminTemplateNode) => void;
  onToggleSection: () => void;
  section: TemplateNodeSection;
  skills: AdminSkill[];
}) {
  const isMilestone = section.node.nodeType === 'MILESTONE';
  const lessonLabel = `${section.children.length} lesson${section.children.length === 1 ? '' : 's'}`;
  const summaryContent = (
    <>
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-sm',
          isMilestone ? 'text-primary-foreground bg-yellow-500' : 'bg-primary/10 text-primary',
        )}
      >
        {isMilestone ? 'M' : 'G'}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-foreground text-sm font-semibold whitespace-normal">
            {section.node.name}
          </span>
          <Badge variant={isMilestone ? 'default' : 'secondary'}>
            {formatEnumLabel(section.node.nodeType)}
          </Badge>
          <Badge variant="outline">{lessonLabel}</Badge>
        </div>
        {section.node.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">{section.node.description}</p>
        ) : null}
      </div>
    </>
  );

  return (
    <section
      className={cn(
        'rounded-lg border',
        isMilestone
          ? 'border-yellow-300 bg-yellow-50/90 shadow-sm'
          : 'border-primary/20 bg-background/90 shadow-sm',
      )}
    >
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        {isMilestone ? (
          <div className="flex min-w-0 flex-1 items-center gap-3">{summaryContent}</div>
        ) : (
          <button
            className="focus-visible:border-ring focus-visible:ring-ring/50 flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-3"
            type="button"
            aria-expanded={isOpen}
            onClick={onToggleSection}
          >
            {summaryContent}
            <HugeiconsIcon
              className={cn('shrink-0 transition-transform', isOpen && 'rotate-180')}
              data-icon="inline-end"
              icon={ArrowDown01Icon}
            />
          </button>
        )}

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onAddChild}>
            Add lesson
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEditNode(section.node)}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDeleteNode(section.node)}>
            Delete
          </Button>
        </div>
      </div>

      {isOpen ? (
        <>
          <Separator />
          <div className="flex flex-col gap-2 p-3">
            {section.children.length > 0 ? (
              section.children.map((node) => (
                <LeafNodeRow
                  key={node.id}
                  node={node}
                  skills={skills}
                  onDelete={() => onDeleteNode(node)}
                  onEdit={() => onEditNode(node)}
                />
              ))
            ) : (
              <p className="text-muted-foreground px-1 py-3 text-sm">
                No required or optional skills in this section.
              </p>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

function LeafNodeRow({
  node,
  onDelete,
  onEdit,
  skills,
}: {
  node: AdminTemplateNode;
  onDelete: () => void;
  onEdit: () => void;
  skills: AdminSkill[];
}) {
  const skillName = skills.find((skill) => skill.id === node.skillId)?.name;

  return (
    <article className="border-border/80 bg-background rounded-md border px-3 py-3 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-medium">{node.name}</h4>
            <Badge variant={node.nodeType === 'REQUIRED' ? 'default' : 'outline'}>
              {formatEnumLabel(node.nodeType)}
            </Badge>
          </div>
          <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <span>{skillName ?? node.skillId ?? 'No skill linked'}</span>
            <span>
              {node.estimatedHours === null ? 'Hours not set' : `${node.estimatedHours} hours`}
            </span>
          </div>
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
    </article>
  );
}

function OrphanNodesList({
  nodes,
  onDeleteNode,
  onEditNode,
  skills,
}: {
  nodes: AdminTemplateNode[];
  onDeleteNode: (node: AdminTemplateNode) => void;
  onEditNode: (node: AdminTemplateNode) => void;
  skills: AdminSkill[];
}) {
  return (
    <section className="border-destructive/30 bg-destructive/5 rounded-lg border p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">Unsectioned lessons</h3>
        <p className="text-muted-foreground text-sm">
          These required or optional nodes do not have a visible parent section.
        </p>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {nodes.map((node) => (
          <LeafNodeRow
            key={node.id}
            node={node}
            skills={skills}
            onDelete={() => onDeleteNode(node)}
            onEdit={() => onEditNode(node)}
          />
        ))}
      </div>
    </section>
  );
}

function TemplateNodeFormDrawer({
  drawer,
  isLoadingSkills,
  nodes,
  onOpenChange,
  onSubmit,
  skills,
  template,
}: {
  drawer: NodeDrawerState | null;
  isLoadingSkills: boolean;
  nodes: AdminTemplateNode[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AdminTemplateNodePayload, node?: AdminTemplateNode) => Promise<void>;
  skills: AdminSkill[];
  template: AdminTemplate | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const node = drawer?.node;
  const form = useForm<AdminTemplateNodeFormValues>({
    defaultValues: getNodeFormDefaults(drawer),
    resolver: zodResolver(adminTemplateNodeFormSchema),
  });
  const errors = form.formState.errors;
  const isOpen = !!drawer;
  const nodeType = form.watch('nodeType');
  const isLeafNode = isLeafNodeType(nodeType);
  const parentSections = useMemo(
    () =>
      nodes
        .filter((candidate) => isSectionNodeType(candidate.nodeType) && candidate.id !== node?.id)
        .sort(sortTemplateNodes),
    [node?.id, nodes],
  );
  const skillOptions = useMemo(() => getSkillOptions(skills, node), [node, skills]);

  useEffect(() => {
    if (isOpen) {
      form.reset(getNodeFormDefaults(drawer));
    }
  }, [drawer, form, isOpen]);

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);

    try {
      await onSubmit(toNodePayload(values), node);
      onOpenChange(false);
    } catch (error) {
      toast.error(node ? 'Template node update failed' : 'Template node creation failed', {
        description: getApiErrorMessage(error, 'Please check the node details and try again.'),
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
            <DrawerTitle>{node ? 'Edit template node' : 'Create template node'}</DrawerTitle>
            <DrawerDescription>
              {template
                ? `Nodes will stay scoped to ${template.title}.`
                : 'Select a template before editing nodes.'}
            </DrawerDescription>
          </DrawerHeader>
          <div className="scrollbar-thin flex-1 overflow-y-auto px-4">
            <FieldGroup>
              <Field data-invalid={!!errors.nodeType}>
                <FieldLabel htmlFor="template-node-type">Node type</FieldLabel>
                <NativeSelect
                  id="template-node-type"
                  aria-invalid={!!errors.nodeType}
                  {...form.register('nodeType')}
                >
                  {TEMPLATE_NODE_TYPE_VALUES.map((type) => (
                    <option key={type} value={type}>
                      {formatEnumLabel(type)}
                    </option>
                  ))}
                </NativeSelect>
                <FieldError errors={[errors.nodeType]} />
              </Field>

              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="template-node-name">Name</FieldLabel>
                <Input
                  id="template-node-name"
                  aria-invalid={!!errors.name}
                  {...form.register('name')}
                />
                <FieldError errors={[errors.name]} />
              </Field>

              {nodeType === 'MILESTONE' ? (
                <Field data-invalid={!!errors.description}>
                  <FieldLabel htmlFor="template-node-description">Description</FieldLabel>
                  <TextareaControl
                    id="template-node-description"
                    placeholder="Optional milestone brief."
                    aria-invalid={!!errors.description}
                    rows={5}
                    {...form.register('description')}
                  />
                  <FieldError errors={[errors.description]} />
                </Field>
              ) : null}

              {isLeafNode ? (
                <>
                  <Field data-invalid={!!errors.parentId}>
                    <FieldLabel htmlFor="template-node-parent">Parent section</FieldLabel>
                    <NativeSelect
                      id="template-node-parent"
                      aria-invalid={!!errors.parentId}
                      {...form.register('parentId')}
                    >
                      <option value="">Choose a section</option>
                      {parentSections.map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.name}
                        </option>
                      ))}
                    </NativeSelect>
                    <FieldError errors={[errors.parentId]} />
                  </Field>

                  <Field data-invalid={!!errors.skillId}>
                    <FieldLabel htmlFor="template-node-skill">Skill</FieldLabel>
                    <NativeSelect
                      id="template-node-skill"
                      disabled={isLoadingSkills}
                      aria-invalid={!!errors.skillId}
                      {...form.register('skillId')}
                    >
                      <option value="">
                        {isLoadingSkills ? 'Loading skills...' : 'Choose a skill'}
                      </option>
                      {skillOptions.map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.name}
                        </option>
                      ))}
                    </NativeSelect>
                    <FieldError errors={[errors.skillId]} />
                  </Field>

                  <Field data-invalid={!!errors.estimatedHours}>
                    <FieldLabel htmlFor="template-node-hours">Estimated hours</FieldLabel>
                    <Input
                      id="template-node-hours"
                      placeholder="Optional"
                      inputMode="decimal"
                      aria-invalid={!!errors.estimatedHours}
                      {...form.register('estimatedHours')}
                    />
                    <FieldError errors={[errors.estimatedHours]} />
                  </Field>
                </>
              ) : null}
            </FieldGroup>
          </div>
          <DrawerFooter>
            <Button type="submit" disabled={isSubmitting || !template}>
              {isSubmitting ? 'Saving...' : 'Save node'}
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

function NodeListPlaceholder() {
  return Array.from({ length: 3 }).map((_, index) => (
    <div key={index} className="border-border rounded-lg border p-4">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <Skeleton className="h-4 w-1/2 rounded-full" />
        <Separator />
        <Skeleton className="h-14 w-full rounded-md" />
      </div>
    </div>
  ));
}

function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cn(CONTROL_CLASS_NAME, className)} {...props} />;
}

function TextareaControl({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(CONTROL_CLASS_NAME, 'min-h-28 resize-y', className)} {...props} />;
}

function buildNodeSections(nodes: AdminTemplateNode[]): TemplateNodeSection[] {
  const childrenByParentId = nodes.reduce<Map<string, AdminTemplateNode[]>>((childMap, node) => {
    if (!node.parentId || !isLeafNodeType(node.nodeType)) {
      return childMap;
    }

    const children = childMap.get(node.parentId) ?? [];
    children.push(node);
    childMap.set(node.parentId, children);

    return childMap;
  }, new Map());

  return nodes
    .filter((node) => !node.parentId && isSectionNodeType(node.nodeType))
    .sort(sortTemplateNodes)
    .map((node) => ({
      children: (childrenByParentId.get(node.id) ?? []).sort(sortTemplateNodes),
      node,
    }));
}

function getOrphanNodes(nodes: AdminTemplateNode[]): AdminTemplateNode[] {
  const sectionIds = new Set(
    nodes.filter((node) => isSectionNodeType(node.nodeType)).map((node) => node.id),
  );

  return nodes
    .filter(
      (node) => isLeafNodeType(node.nodeType) && (!node.parentId || !sectionIds.has(node.parentId)),
    )
    .sort(sortTemplateNodes);
}

function getSkillOptions(skills: AdminSkill[], node?: AdminTemplateNode): AdminSkill[] {
  if (!node?.skillId || skills.some((skill) => skill.id === node.skillId)) {
    return skills;
  }

  return [
    ...skills,
    {
      createdAt: node.createdAt,
      defaultEstimatedHours: node.estimatedHours,
      description: null,
      id: node.skillId,
      name: `${node.name} (current skill)`,
      roleCategory: null,
      updatedAt: node.createdAt,
    },
  ];
}

function getNodeFormDefaults(drawer: NodeDrawerState | null): AdminTemplateNodeFormValues {
  if (drawer?.mode === 'edit') {
    return {
      description: drawer.node.description ?? '',
      estimatedHours:
        drawer.node.estimatedHours === null || drawer.node.estimatedHours === undefined
          ? ''
          : String(drawer.node.estimatedHours),
      name: drawer.node.name,
      nodeType: drawer.node.nodeType,
      parentId: drawer.node.parentId ?? '',
      skillId: drawer.node.skillId ?? '',
    };
  }

  return {
    description: drawer?.defaults?.description ?? '',
    estimatedHours: drawer?.defaults?.estimatedHours ?? '',
    name: drawer?.defaults?.name ?? '',
    nodeType: drawer?.defaults?.nodeType ?? 'GROUP',
    parentId: drawer?.defaults?.parentId ?? '',
    skillId: drawer?.defaults?.skillId ?? '',
  };
}

function toNodePayload(values: AdminTemplateNodeFormValues): AdminTemplateNodePayload {
  const nodeType = values.nodeType;
  const name = values.name.trim();

  if (nodeType === 'GROUP') {
    return {
      description: null,
      estimatedHours: null,
      name,
      nodeType,
      parentId: null,
      skillId: null,
    };
  }

  if (nodeType === 'MILESTONE') {
    const description = values.description.trim();

    return {
      description: description || null,
      estimatedHours: null,
      name,
      nodeType,
      parentId: null,
      skillId: null,
    };
  }

  const estimatedHours = values.estimatedHours.trim();

  return {
    description: null,
    estimatedHours: estimatedHours ? Number(estimatedHours) : null,
    name,
    nodeType,
    parentId: values.parentId,
    skillId: values.skillId,
  };
}

function getDeleteDescription(node: AdminTemplateNode | null): string {
  if (!node) {
    return '';
  }

  if (isSectionNodeType(node.nodeType)) {
    return `Delete "${node.name}"? Required and optional lessons under this section will also be removed.`;
  }

  return `Delete "${node.name}" from this template?`;
}

function sortTemplateNodes(left: AdminTemplateNode, right: AdminTemplateNode): number {
  if (left.posY !== right.posY) {
    return left.posY - right.posY;
  }

  if (left.posX !== right.posX) {
    return left.posX - right.posX;
  }

  return left.name.localeCompare(right.name);
}

function isSectionNodeType(nodeType: TemplateNodeType): boolean {
  return nodeType === 'GROUP' || nodeType === 'MILESTONE';
}

function isLeafNodeType(nodeType: TemplateNodeType): boolean {
  return nodeType === 'REQUIRED' || nodeType === 'OPTIONAL';
}

function formatEnumLabel(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');
}
