'use client';

import type { FormEvent } from 'react';

import { NativeSelect } from '@repo/design-system/components/common/native-select';
import { Button } from '@repo/design-system/components/ui/button';
import { Field, FieldLabel } from '@repo/design-system/components/ui/field';
import { Input } from '@repo/design-system/components/ui/input';
import { useEffect, useState } from 'react';

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

interface AdminPaginationProps {
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function AdminPagination({
  isLoading,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  total,
  totalPages,
}: AdminPaginationProps) {
  const displayTotalPages = Math.max(totalPages, 1);
  const [pageInput, setPageInput] = useState(String(page));

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const pages = getVisiblePages(page, displayTotalPages);

  const handleGoToPage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const requestedPage = Number(pageInput);

    if (!Number.isFinite(requestedPage)) {
      setPageInput(String(page));
      return;
    }

    onPageChange(clampPage(Math.trunc(requestedPage), displayTotalPages));
  };

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <p className="text-muted-foreground text-sm">
        {total} items, page {page} of {displayTotalPages}
      </p>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading || page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            Previous
          </Button>
          {pages.map((visiblePage) => (
            <Button
              key={visiblePage}
              variant={visiblePage === page ? 'secondary' : 'outline'}
              size="sm"
              disabled={isLoading}
              aria-current={visiblePage === page ? 'page' : undefined}
              onClick={() => onPageChange(visiblePage)}
            >
              {visiblePage}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading || page >= displayTotalPages}
            onClick={() => onPageChange(Math.min(displayTotalPages, page + 1))}
          >
            Next
          </Button>
        </div>

        <form className="flex items-end gap-2" onSubmit={handleGoToPage}>
          <Field className="w-28">
            <FieldLabel className="text-xs" htmlFor="admin-go-to-page">
              Go to page
            </FieldLabel>
            <Input
              id="admin-go-to-page"
              min={1}
              max={displayTotalPages}
              type="number"
              value={pageInput}
              onChange={(event) => setPageInput(event.target.value)}
            />
          </Field>
          <Button variant="outline" size="sm" type="submit" disabled={isLoading}>
            Go
          </Button>
        </form>

        <Field className="w-36">
          <FieldLabel className="text-xs" htmlFor="admin-page-size">
            Page size
          </FieldLabel>
          <NativeSelect
            id="admin-page-size"
            value={String(pageSize)}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} per page
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
    </div>
  );
}

function clampPage(page: number, totalPages: number): number {
  return Math.min(Math.max(page, 1), totalPages);
}

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
