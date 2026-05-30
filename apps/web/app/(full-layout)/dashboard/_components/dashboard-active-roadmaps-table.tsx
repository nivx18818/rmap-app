import type { Route } from 'next';

import {
  Alert02Icon,
  ArrowRight02FreeIcons,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import Link from 'next/link';

import type { DashboardActiveRoadmap } from '../_types/dashboard.types';

import { useRoadmapTable } from '../_hooks/use-roadmap-table';
import { clampPercent, formatDate, formatRoleCategory } from '../_utils/formatters';

interface DashboardActiveRoadmapsTableProps {
  onSelectRoadmap: (roadmapId: string) => void;
  roadmaps: DashboardActiveRoadmap[];
  selectedRoadmapId: null | string;
}

const PAGE_SIZE = 10;

function StatusBadge({ roadmap }: { roadmap: DashboardActiveRoadmap }) {
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
  roadmaps,
  selectedRoadmapId,
}: DashboardActiveRoadmapsTableProps) {
  const {
    filter,
    currentPage,
    totalPages,
    pagedRoadmaps,
    pageNumbers,
    filteredRoadmapsLength,
    handleFilterChange,
    handlePageChange,
  } = useRoadmapTable(roadmaps, PAGE_SIZE);

  return (
    <Card className="hidden rounded-lg md:flex">
      <Tabs value={filter} onValueChange={handleFilterChange}>
        <CardHeader>
          <CardTitle>Active roadmaps</CardTitle>
          <TabsList className="mt-3">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="behind">Behind pace</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className="px-0">
          <TabsContent value={filter}>
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

                        return (
                          <TableRow
                            key={roadmap.roadmapId}
                            data-state={isSelected ? 'selected' : undefined}
                            onClick={() => onSelectRoadmap(roadmap.roadmapId)}
                          >
                            <TableCell className="min-w-72 pl-4">
                              <div className="flex min-w-0 flex-col gap-1">
                                <span className="text-foreground truncate font-semibold">
                                  {roadmap.title}
                                </span>
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
                              <Button
                                size="sm"
                                variant="outline"
                                render={
                                  <Link href={`/roadmaps/${roadmap.roadmapId}` as Route<string>}>
                                    View
                                    <HugeiconsIcon
                                      data-icon="inline-end"
                                      icon={ArrowRight02FreeIcons}
                                    />
                                  </Link>
                                }
                              />
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
              </>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
