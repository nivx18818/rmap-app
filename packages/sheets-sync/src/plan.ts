import { computeSyncHash } from './hash.js';
import { createEmptyRow } from './normalize.js';
import {
  DEFAULT_COLUMNS,
  type ColumnName,
  type NormalizedProjectItem,
  type RowData,
  type SyncConfig,
} from './types.js';

export type PlannedRowKind = 'archive' | 'insert' | 'update';

export interface PlannedHeaderWrite {
  range: string;
  values: string[];
}

export interface PlannedRowWrite {
  kind: PlannedRowKind;
  range: string;
  rowNumber: number;
  values: string[];
}

export interface SyncPlanSummary {
  archivedRows: number;
  fetchedItems: number;
  headerUpdated: boolean;
  insertedRows: number;
  skippedUnchangedRows: number;
  updatedRows: number;
}

export interface SyncPlan {
  headerWrite?: PlannedHeaderWrite;
  rowWrites: PlannedRowWrite[];
  summary: SyncPlanSummary;
}

interface PlanSheetSyncInput {
  config: SyncConfig;
  existingValues: string[][];
  items: readonly NormalizedProjectItem[];
  nowIso: string;
  sheetName: string;
}

interface ExistingRow {
  row: RowData;
  rowNumber: number;
  values: string[];
}

const KNOWN_COLUMNS = new Set<string>(DEFAULT_COLUMNS);

export function planSheetSync(input: PlanSheetSyncInput): SyncPlan {
  const expectedColumns = [...input.config.visibleColumns, ...input.config.metadataColumns];
  const existingHeader = input.existingValues[0] ?? [];
  const plannedHeader = mergeHeader(existingHeader, expectedColumns);
  const headerUpdated = !arraysEqual(existingHeader, plannedHeader);
  const existingRows = mapExistingRows(input.existingValues.slice(1), plannedHeader);
  const rowWrites: PlannedRowWrite[] = [];
  const seenSyncKeys = new Set<string>();
  let insertedRows = 0;
  let updatedRows = 0;
  let skippedUnchangedRows = 0;

  input.items.forEach((item) => {
    seenSyncKeys.add(item.syncKey);
    const existingRow = existingRows.get(item.syncKey);
    const values = rowToValues(item.row, plannedHeader, existingRow?.values);

    if (existingRow === undefined) {
      const rowNumber = Math.max(input.existingValues.length, 1) + insertedRows + 1;
      rowWrites.push({
        kind: 'insert',
        range: rowRange(input.sheetName, rowNumber, plannedHeader.length),
        rowNumber,
        values,
      });
      insertedRows += 1;
      return;
    }

    if (
      existingRow.row['Sync Hash'] === item.syncHash &&
      existingRow.row.Archived === item.row.Archived &&
      existingRow.row['Archived At'] === item.row['Archived At']
    ) {
      skippedUnchangedRows += 1;
      return;
    }

    rowWrites.push({
      kind: 'update',
      range: rowRange(input.sheetName, existingRow.rowNumber, plannedHeader.length),
      rowNumber: existingRow.rowNumber,
      values,
    });
    updatedRows += 1;
  });

  let archivedRows = 0;

  for (const [syncKey, existingRow] of existingRows.entries()) {
    if (seenSyncKeys.has(syncKey) || existingRow.row.Archived === 'TRUE') {
      continue;
    }

    const archivedRow = {
      ...existingRow.row,
      Archived: 'TRUE',
      'Archived At': input.nowIso,
    };
    archivedRow['Sync Hash'] = computeSyncHash(archivedRow, expectedColumns);
    rowWrites.push({
      kind: 'archive',
      range: rowRange(input.sheetName, existingRow.rowNumber, plannedHeader.length),
      rowNumber: existingRow.rowNumber,
      values: rowToValues(archivedRow, plannedHeader, existingRow.values),
    });
    archivedRows += 1;
  }

  const headerWrite = headerUpdated
    ? {
        range: rowRange(input.sheetName, 1, plannedHeader.length),
        values: plannedHeader,
      }
    : undefined;

  return {
    headerWrite,
    rowWrites,
    summary: {
      archivedRows,
      fetchedItems: input.items.length,
      headerUpdated,
      insertedRows,
      skippedUnchangedRows,
      updatedRows,
    },
  };
}

export function mergeHeader(
  existingHeader: readonly string[],
  expectedColumns: readonly ColumnName[],
): string[] {
  const headerHasContent = existingHeader.some((column) => column.trim() !== '');

  if (!headerHasContent) {
    return [...expectedColumns];
  }

  const mergedHeader = [...existingHeader];

  for (const column of expectedColumns) {
    if (!mergedHeader.includes(column)) {
      mergedHeader.push(column);
    }
  }

  return mergedHeader;
}

export function quoteSheetName(sheetName: string): string {
  return `'${sheetName.replaceAll("'", "''")}'`;
}

export function rowRange(sheetName: string, rowNumber: number, width: number): string {
  return `${quoteSheetName(sheetName)}!A${rowNumber}:${columnName(width)}${rowNumber}`;
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function columnName(columnNumber: number): string {
  let remaining = columnNumber;
  let name = '';

  while (remaining > 0) {
    const modulo = (remaining - 1) % 26;
    name = String.fromCharCode(65 + modulo) + name;
    remaining = Math.floor((remaining - modulo) / 26);
  }

  return name;
}

function isColumnName(value: string): value is ColumnName {
  return KNOWN_COLUMNS.has(value);
}

function mapExistingRows(values: string[][], header: readonly string[]): Map<string, ExistingRow> {
  const rows = new Map<string, ExistingRow>();

  values.forEach((rowValues, index) => {
    const row = valuesToRowData(rowValues, header);
    const syncKey = row['Sync Key'];

    if (syncKey === '' || rows.has(syncKey)) {
      return;
    }

    rows.set(syncKey, {
      row,
      rowNumber: index + 2,
      values: rowValues,
    });
  });

  return rows;
}

function rowToValues(
  row: RowData,
  header: readonly string[],
  existingValues?: readonly string[],
): string[] {
  return header.map((column, index) =>
    isColumnName(column) ? row[column] : (existingValues?.[index] ?? ''),
  );
}

function valuesToRowData(values: readonly string[], header: readonly string[]): RowData {
  const row = createEmptyRow();

  header.forEach((column, index) => {
    if (isColumnName(column)) {
      row[column] = values[index] ?? '';
    }
  });

  return row;
}
