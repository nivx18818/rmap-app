'use client';

import type { Route } from 'next';

import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@repo/design-system/components/ui/drawer';
import { Separator } from '@repo/design-system/components/ui/separator';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { cn } from '@repo/design-system/lib/utils';
import Link from 'next/link';

import type { RoadmapNodeDetail } from '../_types/roadmap-node-detail.types';

import { NODE_TYPE_LABELS, STATUS_LABELS } from '../_constants/roadmap-node.constants';
import { statusBadgeClasses } from '../_constants/roadmap-stack-list.constants';
import { useResponsiveDrawerDirection } from '../_hooks/use-responsive-drawer-direction';
import { useRoadmapNodeDetail } from '../_hooks/use-roadmap-node-detail';

const RESOURCE_TYPE_LABELS = {
  ARTICLE: 'Article',
  COURSE: 'Course',
  DOCS: 'Docs',
  YOUTUBE: 'YouTube',
} as const satisfies Record<RoadmapNodeDetail['resources'][number]['resourceType'], string>;

interface RoadmapNodeDetailDrawerProps {
  onOpenChange: (isOpen: boolean) => void;
  onProgressUpdated?: () => void;
  roadmapId: string;
  selectedNodeId: string | null;
}

function RoadmapNodeDetailDrawerSkeleton() {
  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

function RoadmapNodeDetailBody({ nodeDetail }: { nodeDetail: RoadmapNodeDetail }) {
  const description =
    nodeDetail.skillDescription ??
    nodeDetail.projectBrief ??
    nodeDetail.description ??
    'No description available for this node yet.';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
      <section className="flex flex-col gap-2">
        <h3 className="text-foreground text-sm font-semibold">
          {nodeDetail.nodeType === 'MILESTONE' ? 'Project brief' : 'Description'}
        </h3>
        <p className="text-muted-foreground text-sm leading-6">{description}</p>
      </section>

      <Separator />

      <section className="flex flex-col gap-2">
        <h3 className="text-foreground text-sm font-semibold">Prerequisites</h3>
        {nodeDetail.prerequisites.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {nodeDetail.prerequisites.map((prerequisite) => (
              <li key={prerequisite.id} className="text-muted-foreground text-sm">
                {prerequisite.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No prerequisites listed for this node.</p>
        )}
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-foreground text-sm font-semibold">Resources</h3>
        </div>
        {nodeDetail.resources.length > 0 ? (
          <div className="flex flex-col gap-2">
            {nodeDetail.resources.map((resource) => (
              <a
                key={resource.id}
                className="border-border bg-background hover:bg-muted/50 flex flex-col gap-2 rounded-md border p-3 transition-colors"
                href={resource.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="text-foreground text-sm font-medium">{resource.title}</span>
                <span className="flex flex-wrap gap-2">
                  <Badge variant="outline">{RESOURCE_TYPE_LABELS[resource.resourceType]}</Badge>
                  {resource.isFree ? <Badge variant="secondary">Free</Badge> : null}
                  {resource.isPrimary ? <Badge variant="secondary">Primary</Badge> : null}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No resources listed for this node.</p>
        )}
      </section>
    </div>
  );
}

function RoadmapNodeDetailActions({
  actionErrorMessage,
  isMarkingComplete,
  nodeDetail,
  onMarkComplete,
  roadmapId,
}: {
  actionErrorMessage: string | null;
  isMarkingComplete: boolean;
  nodeDetail: RoadmapNodeDetail;
  onMarkComplete: () => void;
  roadmapId: string;
}) {
  const status = nodeDetail.progress?.status ?? 'LOCKED';
  const isLeafNode = nodeDetail.nodeType === 'OPTIONAL' || nodeDetail.nodeType === 'REQUIRED';
  const isMilestone = nodeDetail.nodeType === 'MILESTONE';
  const quizHref = `/roadmaps/${roadmapId}/nodes/${nodeDetail.id}/quiz` as Route<string>;
  const canTakeQuiz = isLeafNode && status === 'IN_PROGRESS';
  const canMarkComplete =
    status === 'IN_PROGRESS' &&
    (isMilestone || (isLeafNode && nodeDetail.progress?.quizPassed === true));
  const shouldShowComplete = status === 'IN_PROGRESS' && (isLeafNode || isMilestone);

  if (status === 'LOCKED') {
    return (
      <p className="text-muted-foreground px-4 py-4 text-sm">
        Complete earlier roadmap nodes to unlock this one.
      </p>
    );
  }

  if (status === 'COMPLETED') {
    return <p className="text-muted-foreground px-4 py-4 text-sm">This node is complete.</p>;
  }

  return (
    <DrawerFooter>
      {canTakeQuiz ? (
        <Button render={<Link href={quizHref}>Take quiz</Link>} />
      ) : isLeafNode ? (
        <Button disabled type="button">
          Take quiz
        </Button>
      ) : null}
      {shouldShowComplete ? (
        <Button
          variant="outline"
          disabled={!canMarkComplete || isMarkingComplete}
          type="button"
          onClick={onMarkComplete}
        >
          {isMarkingComplete ? 'Marking complete...' : 'Mark complete'}
        </Button>
      ) : null}
      {isLeafNode && nodeDetail.progress?.quizPassed !== true ? (
        <p className="text-muted-foreground text-xs">Pass the quiz to enable completion.</p>
      ) : null}
      {actionErrorMessage ? <p className="text-destructive text-xs">{actionErrorMessage}</p> : null}
    </DrawerFooter>
  );
}

export function RoadmapNodeDetailDrawer({
  onOpenChange,
  onProgressUpdated,
  roadmapId,
  selectedNodeId,
}: RoadmapNodeDetailDrawerProps) {
  const drawerDirection = useResponsiveDrawerDirection();
  const {
    actionErrorMessage,
    errorMessage,
    isLoading,
    isMarkingComplete,
    markComplete,
    nodeDetail,
  } = useRoadmapNodeDetail({
    nodeId: selectedNodeId,
    onProgressUpdated,
    roadmapId,
  });
  const status = nodeDetail?.progress?.status ?? 'LOCKED';
  const description = nodeDetail
    ? `${NODE_TYPE_LABELS[nodeDetail.nodeType]}${nodeDetail.estimatedHours ? ` - ${nodeDetail.estimatedHours} hours` : ''}`
    : 'Loading node detail';

  return (
    <Drawer direction={drawerDirection} open={Boolean(selectedNodeId)} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] lg:h-full lg:max-h-none lg:w-104 lg:max-w-none lg:rounded-none">
        <DrawerHeader className="gap-2 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <DrawerTitle>{nodeDetail?.name ?? 'Roadmap node'}</DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </div>
            {nodeDetail ? (
              <Badge variant="outline" className={cn('shrink-0', statusBadgeClasses[status])}>
                {STATUS_LABELS[status]}
              </Badge>
            ) : null}
          </div>
        </DrawerHeader>

        <Separator />

        {isLoading ? (
          <RoadmapNodeDetailDrawerSkeleton />
        ) : errorMessage ? (
          <div className="flex flex-col gap-2 px-4 py-4">
            <h3 className="text-foreground text-sm font-semibold">Unable to load node</h3>
            <p className="text-muted-foreground text-sm">{errorMessage}</p>
          </div>
        ) : nodeDetail ? (
          <RoadmapNodeDetailBody nodeDetail={nodeDetail} />
        ) : (
          <div className="flex flex-col gap-2 px-4 py-4">
            <h3 className="text-foreground text-sm font-semibold">Node not found</h3>
            <p className="text-muted-foreground text-sm">
              Select a visible roadmap node to view its detail.
            </p>
          </div>
        )}

        {nodeDetail ? (
          <>
            <Separator />
            <RoadmapNodeDetailActions
              actionErrorMessage={actionErrorMessage}
              isMarkingComplete={isMarkingComplete}
              nodeDetail={nodeDetail}
              roadmapId={roadmapId}
              onMarkComplete={markComplete}
            />
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
