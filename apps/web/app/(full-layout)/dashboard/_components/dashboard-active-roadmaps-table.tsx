'use client';

import type { Route } from 'next';

import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  NodeRemoveIcon,
} from '@hugeicons/core-free-icons';
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
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@repo/design-system/components/ui/pagination';
import { Progress } from '@repo/design-system/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import Link from 'next/link';
import { useState } from 'react';

import { buildRoadmapHref } from '@/utils/roadmap-url';

import type { DashboardRoadmap } from '../_types/dashboard.types';

import { useRoadmapTable } from '../_hooks/use-roadmap-table';
import { clampPercent, formatDate, formatRoleCategory } from '../_utils/formatters';

interface DashboardActiveRoadmapsTableProps {
  onSelectRoadmap: (roadmapId: string) => void;
  onRemoveRoadmap: (roadmap: DashboardRoadmap) => Promise<boolean>;
  roadmaps: DashboardRoadmap[];
  selectedRoadmapId: null | string;
}

const PAGE_SIZE = 10;

function StatusBadge({ roadmap }: { roadmap: DashboardRoadmap }) {
  if (roadmap.startedAt === null) {
    return (
      <Badge variant="outline" className="w-fit">
        <HugeiconsIcon data-icon="inline-start" icon={NodeRemoveIcon} />
        Not started
      </Badge>
    );
  }

  if (roadmap.timelineWarning?.isBehind) {
    return (
      <Badge variant="destructive">
        <HugeiconsIcon data-icon="inline-start" icon={Alert02Icon} />
        Behind pace
      </Badge>
    );
  }

  if (roadmap.nodesTotal > 0 && roadmap.nodesCompleted === roadmap.nodesTotal) {
    return (
      <Badge variant="default">
        <HugeiconsIcon data-icon="inline-start" icon={CheckmarkCircle02Icon} />
        Completed
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <HugeiconsIcon data-icon="inline-start" icon={CheckmarkCircle02Icon} />
      On track
    </Badge>
  );
}

export function DashboardActiveRoadmapsTable({
  onSelectRoadmap,
  onRemoveRoadmap,
  roadmaps,
  selectedRoadmapId,
}: DashboardActiveRoadmapsTableProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [roadmapToRemove, setRoadmapToRemove] = useState<DashboardRoadmap | null>(null);

  const {
    statusFilter,
    typeFilter,
    currentPage,
    totalPages,
    pagedRoadmaps,
    pageNumbers,
    filteredRoadmapsLength,
    handleStatusFilterChange,
    handleTypeFilterChange,
    handlePageChange,
  } = useRoadmapTable(roadmaps, PAGE_SIZE);

  return (
    <Card className="rounded-lg">
      <CardHeader className="flex-col gap-3">
        <CardTitle>My roadmaps</CardTitle>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Tabs value={statusFilter} onValueChange={handleStatusFilterChange}>
            <TabsList>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="behind">Behind pace</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={typeFilter} onValueChange={handleTypeFilterChange}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="ai">AI roadmap</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {filteredRoadmapsLength === 0 ? (
          <div className="text-muted-foreground px-4 py-10 text-center text-sm">
            No roadmaps in this view.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Roadmap</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Deadline</TableHead>
                    <TableHead className="pr-4 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRoadmaps.map((roadmap) => {
                    const progress = clampPercent(roadmap.completionPct);
                    const isSelected = roadmap.roadmapId === selectedRoadmapId;
                    const roadmapHref = buildRoadmapHref({
                      id: roadmap.roadmapId,
                      title: roadmap.title,
                    }) as Route<string>;

                    return (
                      <TableRow
                        key={roadmap.roadmapId}
                        className="hover:cursor-pointer"
                        data-state={isSelected ? 'selected' : undefined}
                        onClick={() => onSelectRoadmap(roadmap.roadmapId)}
                      >
                        <TableCell className="min-w-40 pl-4 md:min-w-72">
                          <div className="flex min-w-0 flex-col gap-1">
                            <Link className="w-fit" href={roadmapHref}>
                              <span className="text-foreground truncate font-semibold hover:underline">
                                {roadmap.title}
                              </span>
                            </Link>
                            <span className="text-muted-foreground truncate text-xs">
                              {formatRoleCategory(roadmap.roleCategory)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={roadmap.isTemplate ? 'secondary' : 'default'}>
                            {roadmap.isTemplate ? 'Template roadmap' : 'AI roadmap'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden min-w-40 md:table-cell">
                          <div className="flex items-center gap-1">
                            <Progress className="w-32" value={progress} />
                            <span className="w-8 text-right text-sm font-semibold">
                              {progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge roadmap={roadmap} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm font-medium">
                            {formatDate(roadmap.deadlineDate)}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={isRemoving}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoadmapToRemove(roadmap);
                              }}
                            >
                              <HugeiconsIcon icon={Delete02Icon} />
                              <span className="sr-only">
                                {roadmap.isTemplate ? 'Delete learning progress' : 'Delete roadmap'}
                              </span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="border-t px-4 py-3">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        href="#"
                        aria-disabled={currentPage === 1}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage - 1);
                        }}
                      />
                    </PaginationItem>

                    {pageNumbers.map((page, idx) =>
                      page === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={page === currentPage}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}

                    <PaginationItem>
                      <PaginationNext
                        className={
                          currentPage === totalPages ? 'pointer-events-none opacity-50' : ''
                        }
                        href="#"
                        aria-disabled={currentPage === totalPages}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(currentPage + 1);
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
            <AlertDialog
              open={!!roadmapToRemove}
              onOpenChange={(open) => {
                if (!open && !isRemoving) {
                  setRoadmapToRemove(null);
                }
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia className="bg-destructive/10 text-destructive">
                    <HugeiconsIcon icon={Delete02Icon} />
                  </AlertDialogMedia>
                  <AlertDialogTitle>
                    {roadmapToRemove?.isTemplate
                      ? 'Delete learning progress?'
                      : 'Delete this roadmap?'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {roadmapToRemove?.isTemplate
                      ? 'This removes your progress for this template roadmap. The template itself will remain available and can be started again.'
                      : 'Are you sure you want to delete this AI-generated roadmap? This action cannot be undone.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel variant="ghost" disabled={isRemoving}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={isRemoving}
                    onClick={async () => {
                      if (!roadmapToRemove || isRemoving) return;

                      setIsRemoving(true);
                      try {
                        const wasRemoved = await onRemoveRoadmap(roadmapToRemove);

                        if (wasRemoved) {
                          setRoadmapToRemove(null);
                        }
                      } finally {
                        setIsRemoving(false);
                      }
                    }}
                  >
                    {isRemoving
                      ? 'Deleting...'
                      : roadmapToRemove?.isTemplate
                        ? 'Delete Progress'
                        : 'Delete Roadmap'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
