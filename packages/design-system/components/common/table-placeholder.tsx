import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { TableCell, TableRow } from '@repo/design-system/components/ui/table';

function TablePlaceholder({ colSpan = 5, rows }: { colSpan?: number; rows: number }) {
  return Array.from({ length: rows }).map((_, index) => (
    <TableRow key={index}>
      <TableCell className="h-16" colSpan={colSpan}>
        <Skeleton className="h-4 w-full max-w-180 rounded-full" />
      </TableCell>
    </TableRow>
  ));
}

export { TablePlaceholder };
