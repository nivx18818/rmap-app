import { createHash } from 'node:crypto';

import { DEFAULT_COLUMNS, type ColumnName, type RowData } from './types.js';

const HASH_EXCLUDED_COLUMNS = new Set<ColumnName>(['Sync Hash', 'Archived At']);

export function computeSyncHash(
  row: RowData,
  columns: readonly ColumnName[] = DEFAULT_COLUMNS,
): string {
  const hashInput = columns
    .filter((column) => !HASH_EXCLUDED_COLUMNS.has(column))
    .map((column) => [column, row[column] ?? '']);

  return createHash('sha256').update(JSON.stringify(hashInput)).digest('hex');
}
