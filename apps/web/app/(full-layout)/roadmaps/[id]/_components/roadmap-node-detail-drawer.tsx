'use client';

import type { Route } from 'next';
import type { FormEvent, ReactNode } from 'react';

import { Alert02Icon, CheckmarkCircle02Icon, Copy01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
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
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Separator } from '@repo/design-system/components/ui/separator';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/design-system/components/ui/tooltip';
import { toast } from '@repo/design-system/lib/toast';
import { cn } from '@repo/design-system/lib/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { LoadingState } from '@/components/shared/loading-state';
import { buildRoadmapNodeQuizHref } from '@/utils/roadmap-url';

import type { MilestoneSubmission, RoadmapNodeDetail } from '../_types/roadmap-node-detail.types';
import type { RoadmapNode } from '../_types/roadmap-node.types';

import { NODE_TYPE_LABELS, STATUS_LABELS } from '../_constants/roadmap-node.constants';
import { statusBadgeClasses } from '../_constants/roadmap-stack-list.constants';
import { useResponsiveDrawerDirection } from '../_hooks/use-responsive-drawer-direction';
import { useRoadmapNodeDetail } from '../_hooks/use-roadmap-node-detail';
import {
  parseRoadmapMarkdown,
  type RoadmapMarkdownBlock,
  type RoadmapMarkdownInlineNode,
} from '../_utils/roadmap-markdown.utils';

const RESOURCE_TYPE_LABELS = {
  ARTICLE: 'Article',
  COURSE: 'Course',
  DOCS: 'Docs',
  YOUTUBE: 'YouTube',
} as const satisfies Record<RoadmapNodeDetail['resources'][number]['resourceType'], string>;

const OUTPUT_LOG_PREVIEW_LENGTH = 1800;

function formatOutputLog(outputLog: string | null): string {
  const trimmedOutputLog = outputLog?.trim();

  if (!trimmedOutputLog) {
    return 'No output log was captured for this submission.';
  }

  if (trimmedOutputLog.length <= OUTPUT_LOG_PREVIEW_LENGTH) {
    return trimmedOutputLog;
  }

  return `...${trimmedOutputLog.slice(-OUTPUT_LOG_PREVIEW_LENGTH)}`;
}

function formatSubmissionSummary(submission: MilestoneSubmission): string | null {
  if (
    submission.passRatePct === null ||
    submission.passedTests === null ||
    submission.totalTests === null
  ) {
    return null;
  }

  return `${submission.passedTests}/${submission.totalTests} tests passed (${submission.passRatePct}%).`;
}

function CopyOutputLogButton({ logText }: { logText: string }) {
  const [isCopying, setIsCopying] = useState(false);

  const handleCopy = async () => {
    setIsCopying(true);

    try {
      await navigator.clipboard.writeText(logText);
      toast.success('Output log copied');
    } catch {
      toast.error('Unable to copy output log');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={isCopying}
            type="button"
            aria-label="Copy output log"
            onClick={handleCopy}
          >
            <HugeiconsIcon icon={Copy01Icon} />
            <span className="sr-only">Copy output log</span>
          </Button>
        }
      />
      <TooltipContent side="top">Copy output log</TooltipContent>
    </Tooltip>
  );
}

function MilestoneSubmissionOutputLog({ outputLog }: { outputLog: string | null }) {
  const displayedLog = formatOutputLog(outputLog);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-foreground text-xs font-medium">Raw output log</p>
        <CopyOutputLogButton logText={displayedLog} />
      </div>
      <pre className="bg-background text-muted-foreground max-h-48 overflow-auto rounded border p-3 text-xs whitespace-pre-wrap">
        {displayedLog}
      </pre>
    </div>
  );
}

function MilestoneSubmissionTestResults({
  testResults,
}: {
  testResults: MilestoneSubmission['testResults'];
}) {
  if (!testResults?.length) {
    return null;
  }

  return (
    <ul className="flex flex-col gap-2">
      {testResults.map((testResult, index) => (
        <li
          key={`${testResult.name}-${index}`}
          className="bg-background flex flex-col gap-2 rounded-md border p-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-foreground min-w-0 text-sm font-medium">{testResult.name}</p>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 gap-1',
                testResult.passed
                  ? 'border-chart-2 bg-chart-2/10 text-chart-2'
                  : 'border-destructive/40 bg-destructive/10 text-destructive',
              )}
            >
              <HugeiconsIcon
                className="size-3.5"
                icon={testResult.passed ? CheckmarkCircle02Icon : Alert02Icon}
              />
              {testResult.passed ? 'Passed' : 'Failed'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs leading-5">{testResult.message}</p>
        </li>
      ))}
    </ul>
  );
}

function MilestoneSubmissionFeedback({ submission }: { submission: MilestoneSubmission }) {
  const summary = formatSubmissionSummary(submission);
  const isPassed = submission.status === 'PASSED';
  const title =
    submission.status === 'ERROR'
      ? 'Test execution hit a server-side error.'
      : isPassed
        ? 'Milestone completed automatically'
        : 'Generated tests did not pass.';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-md border p-3',
        isPassed ? 'border-chart-2 bg-chart-2/10' : 'border-border bg-muted/30',
      )}
    >
      <div className="flex flex-col gap-1">
        <p className="text-foreground text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-xs">Attempt {submission.attemptNumber}</p>
        {summary ? <p className="text-muted-foreground text-xs">{summary}</p> : null}
      </div>
      <MilestoneSubmissionTestResults testResults={submission.testResults} />
      <MilestoneSubmissionOutputLog outputLog={submission.outputLog} />
    </div>
  );
}

interface RoadmapNodeDetailDrawerProps {
  canManageProgress?: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProgressUpdated?: () => void;
  roadmapId: string;
  roadmapTitle: string;
  roadmapNodes?: RoadmapNode[];
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

function isSafeMarkdownHref(href: string): boolean {
  return /^(https?:\/\/|mailto:)/i.test(href);
}

function renderRoadmapMarkdownInlineNodes(
  nodes: RoadmapMarkdownInlineNode[],
  keyPrefix: string,
): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;

    if (node.type === 'text') return node.text;

    if (node.type === 'bold') {
      return (
        <strong key={key} className="text-foreground font-semibold">
          {renderRoadmapMarkdownInlineNodes(node.children, key)}
        </strong>
      );
    }

    if (node.type === 'italic') {
      return (
        <em key={key} className="italic">
          {renderRoadmapMarkdownInlineNodes(node.children, key)}
        </em>
      );
    }

    if (node.type === 'code') {
      return (
        <code
          key={key}
          className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-[0.85em]"
        >
          {node.text}
        </code>
      );
    }

    return (
      <a
        key={key}
        className="text-primary font-medium underline-offset-4 hover:underline"
        href={isSafeMarkdownHref(node.href) ? node.href : '#'}
        rel="noopener noreferrer"
        target="_blank"
      >
        {renderRoadmapMarkdownInlineNodes(node.children, key)}
      </a>
    );
  });
}

function RoadmapMarkdownBlockView({
  block,
  index,
}: {
  block: RoadmapMarkdownBlock;
  index: number;
}) {
  if (block.type === 'heading') {
    return (
      <h4 className="text-foreground pt-2 text-sm font-semibold first:pt-0">
        {renderRoadmapMarkdownInlineNodes(block.children, `heading-${index}`)}
      </h4>
    );
  }

  if (block.type === 'paragraph') {
    return (
      <p className="text-muted-foreground text-sm leading-6">
        {renderRoadmapMarkdownInlineNodes(block.children, `paragraph-${index}`)}
      </p>
    );
  }

  const ListTag = block.type === 'ordered-list' ? 'ol' : 'ul';
  const listClasses =
    block.type === 'ordered-list'
      ? 'text-muted-foreground list-decimal space-y-1 pl-5 text-sm leading-6'
      : 'text-muted-foreground list-disc space-y-1 pl-5 text-sm leading-6';

  return (
    <ListTag className={listClasses}>
      {block.items.map((item, itemIndex) => (
        <li key={itemIndex}>
          {renderRoadmapMarkdownInlineNodes(item, `list-${index}-${itemIndex}`)}
        </li>
      ))}
    </ListTag>
  );
}

function RoadmapMarkdownDescription({ value }: { value: string }) {
  const blocks = parseRoadmapMarkdown(value);

  if (blocks.length === 0) {
    return <p className="text-muted-foreground text-sm leading-6">{value}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, index) => (
        <RoadmapMarkdownBlockView key={index} block={block} index={index} />
      ))}
    </div>
  );
}

function MilestoneTestSuiteView({ nodeDetail }: { nodeDetail: RoadmapNodeDetail }) {
  const testSuite = nodeDetail.milestoneTestSuite;

  if (!testSuite) {
    return (
      <p className="text-muted-foreground text-sm">
        The generated test suite will appear when this milestone is unlocked.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-foreground text-sm font-medium">{testSuite.title}</h4>
          <Badge variant="secondary">{testSuite.passThresholdPct}% pass threshold</Badge>
        </div>
        <p className="text-muted-foreground text-sm leading-6">{testSuite.summary}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {testSuite.testCases.map((testCase, index) => (
          <li key={`${testCase.name}-${index}`} className="rounded-md border p-3">
            <p className="text-foreground text-sm font-medium">{testCase.name}</p>
            <p className="text-muted-foreground mt-1 text-sm leading-6">{testCase.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoadmapNodeDetailBody({ nodeDetail }: { nodeDetail: RoadmapNodeDetail }) {
  const description =
    nodeDetail.skillDescription ??
    nodeDetail.projectBrief ??
    nodeDetail.description ??
    'No description available for this node yet.';

  if (nodeDetail.nodeType === 'MILESTONE') {
    const latestSubmission = nodeDetail.latestSubmission;
    const status = nodeDetail.progress?.status ?? 'LOCKED';
    const hasFixedAction = latestSubmission?.status === 'RUNNING' || status === 'IN_PROGRESS';

    return (
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-4',
          hasFixedAction ? 'pb-44' : 'pb-4',
        )}
      >
        <section className="flex flex-col gap-2">
          <h3 className="text-foreground text-sm font-semibold">Project brief</h3>
          <RoadmapMarkdownDescription value={description} />
        </section>

        <Separator />

        <section className="flex flex-col gap-3">
          <h3 className="text-foreground text-sm font-semibold">Test suite</h3>
          <MilestoneTestSuiteView nodeDetail={nodeDetail} />
        </section>

        {latestSubmission && latestSubmission.status !== 'RUNNING' ? (
          <>
            <Separator />

            <section className="flex flex-col gap-3">
              <h3 className="text-foreground text-sm font-semibold">Latest submission</h3>
              <MilestoneSubmissionFeedback submission={latestSubmission} />
            </section>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
      <section className="flex flex-col gap-2">
        <h3 className="text-foreground text-sm font-semibold">Description</h3>
        <RoadmapMarkdownDescription value={description} />
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
  onSubmitMilestoneSubmission,
  roadmapId,
  roadmapTitle,
}: {
  actionErrorMessage: string | null;
  isMarkingComplete: boolean;
  nodeDetail: RoadmapNodeDetail;
  onMarkComplete: () => void;
  onSubmitMilestoneSubmission: (payload: { repoUrl: string }) => Promise<void>;
  roadmapId: string;
  roadmapTitle: string;
}) {
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);
  const [repoUrl, setRepoUrl] = useState(nodeDetail.latestSubmission?.repoUrl ?? '');
  const status = nodeDetail.progress?.status ?? 'LOCKED';
  const isLeafNode = nodeDetail.nodeType === 'OPTIONAL' || nodeDetail.nodeType === 'REQUIRED';
  const isMilestone = nodeDetail.nodeType === 'MILESTONE';
  const latestSubmission = nodeDetail.latestSubmission;
  const quizHref = buildRoadmapNodeQuizHref({
    node: { id: nodeDetail.id, name: nodeDetail.name },
    roadmap: { id: roadmapId, title: roadmapTitle },
  }) as Route<string>;
  const canTakeQuiz = isLeafNode && status === 'IN_PROGRESS';
  const canMarkComplete =
    status === 'IN_PROGRESS' && isLeafNode && nodeDetail.progress?.quizPassed === true;
  const shouldShowComplete = status === 'IN_PROGRESS' && isLeafNode;

  useEffect(() => {
    setRepoUrl(nodeDetail.latestSubmission?.repoUrl ?? '');
  }, [nodeDetail.id, nodeDetail.latestSubmission]);

  const handleMilestoneSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!repoUrl.trim()) return;

    setIsSubmittingMilestone(true);

    try {
      await onSubmitMilestoneSubmission({
        repoUrl: repoUrl.trim(),
      });
    } finally {
      setIsSubmittingMilestone(false);
    }
  };

  if (status === 'LOCKED') {
    return (
      <p className="text-muted-foreground px-4 py-4 text-sm">
        {isMilestone
          ? 'Unlock this milestone to submit your project.'
          : 'Complete earlier roadmap nodes to unlock this one.'}
      </p>
    );
  }

  if (status === 'COMPLETED' && !isMilestone) {
    return <p className="text-muted-foreground px-4 py-4 text-sm">This node is complete.</p>;
  }

  if (isMilestone) {
    if (latestSubmission?.status === 'RUNNING') {
      return (
        <DrawerFooter className="bg-popover absolute inset-x-0 bottom-0 border-t">
          <LoadingState
            className="py-2"
            message="Running tests..."
            description="We are cloning your repository, installing dependencies, injecting your test suite, and running it in the sandbox."
          />
          {actionErrorMessage ? (
            <p className="text-destructive text-xs">{actionErrorMessage}</p>
          ) : null}
        </DrawerFooter>
      );
    }

    if (status === 'COMPLETED' && !latestSubmission) {
      return (
        <p className="text-muted-foreground px-4 py-4 text-sm">
          Milestone completed automatically.
        </p>
      );
    }

    return (
      <DrawerFooter
        className={cn(
          'bg-popover border-t',
          status === 'IN_PROGRESS' ? 'absolute inset-x-0 bottom-0' : undefined,
        )}
      >
        {status === 'IN_PROGRESS' ? (
          <form className="flex flex-col gap-3" onSubmit={handleMilestoneSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="milestone-repo-url">GitHub repository URL</Label>
              <Input
                id="milestone-repo-url"
                placeholder="https://github.com/owner/repo"
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
              />
            </div>
            <Button disabled={!repoUrl.trim() || isSubmittingMilestone} type="submit">
              {isSubmittingMilestone
                ? 'Submitting...'
                : latestSubmission
                  ? 'Submit again'
                  : 'Submit project'}
            </Button>
          </form>
        ) : null}

        {actionErrorMessage ? (
          <p className="text-destructive text-xs">{actionErrorMessage}</p>
        ) : null}
      </DrawerFooter>
    );
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
          onClick={() => onMarkComplete()}
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
  canManageProgress = true,
  onOpenChange,
  onProgressUpdated,
  roadmapId,
  roadmapTitle,
  roadmapNodes = [],
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
    submitMilestoneSubmission,
  } = useRoadmapNodeDetail({
    canFetchProtectedDetail: canManageProgress,
    nodeId: selectedNodeId,
    onProgressUpdated,
    roadmapId,
    roadmapNodes,
  });
  const status = nodeDetail?.progress?.status ?? 'LOCKED';
  const selectedRoadmapNode = roadmapNodes.find((node) => node.id === selectedNodeId);
  const isPreparingMilestoneSuite =
    isLoading &&
    selectedRoadmapNode?.nodeType === 'MILESTONE' &&
    selectedRoadmapNode.progress?.status !== 'LOCKED';
  const description = nodeDetail
    ? `${NODE_TYPE_LABELS[nodeDetail.nodeType]}${nodeDetail.estimatedHours ? ` - ${nodeDetail.estimatedHours} hours` : ''}`
    : 'Loading node detail';
  const shouldShowActions =
    nodeDetail &&
    canManageProgress &&
    !(
      nodeDetail.nodeType === 'MILESTONE' &&
      status === 'COMPLETED' &&
      nodeDetail.latestSubmission?.status === 'PASSED' &&
      !actionErrorMessage
    );

  return (
    <Drawer direction={drawerDirection} open={Boolean(selectedNodeId)} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] lg:h-full lg:max-h-none lg:w-104 lg:max-w-none lg:rounded-none">
        <DrawerHeader className="gap-2 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <DrawerTitle>{nodeDetail?.name ?? 'Roadmap node'}</DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </div>
            {nodeDetail && canManageProgress ? (
              <Badge variant="outline" className={cn('shrink-0', statusBadgeClasses[status])}>
                {STATUS_LABELS[status]}
              </Badge>
            ) : null}
          </div>
        </DrawerHeader>

        <Separator />

        {isLoading ? (
          isPreparingMilestoneSuite ? (
            <div className="px-4 py-8">
              <LoadingState
                message="We are preparing a test suite for you"
                description="This can take a few moments while the generated milestone tests are created."
              />
            </div>
          ) : (
            <RoadmapNodeDetailDrawerSkeleton />
          )
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

        {shouldShowActions ? (
          <>
            <Separator />
            <RoadmapNodeDetailActions
              actionErrorMessage={actionErrorMessage}
              isMarkingComplete={isMarkingComplete}
              nodeDetail={nodeDetail}
              roadmapId={roadmapId}
              roadmapTitle={roadmapTitle}
              onMarkComplete={markComplete}
              onSubmitMilestoneSubmission={submitMilestoneSubmission}
            />
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
