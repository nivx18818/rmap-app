import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { normalizeProjectItem } from './normalize.js';
import { mergeHeader, planSheetSync } from './plan.js';
import {
  DEFAULT_COLUMNS,
  METADATA_COLUMNS,
  VISIBLE_COLUMNS,
  type ColumnName,
  type NormalizedProjectItem,
  type ProjectItem,
  type RowData,
  type SyncConfig,
} from './types.js';

const config: SyncConfig = {
  metadataColumns: [...METADATA_COLUMNS],
  projectNumber: 1,
  projectOwner: 'nivx18818',
  projectOwnerType: 'USER',
  sheetName: 'Sprint Backlog Tracker',
  visibleColumns: [...VISIBLE_COLUMNS],
};
const header = [...config.visibleColumns, ...config.metadataColumns];

test('creates the expected header row when the sheet is empty', () => {
  const plan = planSheetSync({
    config,
    existingValues: [],
    items: [],
    nowIso: '2026-05-31T00:00:00Z',
    sheetName: config.sheetName,
  });

  assert.deepEqual(plan.headerWrite, {
    range: "'Sprint Backlog Tracker'!A1:P1",
    values: header,
  });
  assert.equal(plan.summary.headerUpdated, true);
});

test('appends missing configured columns to an existing header', () => {
  assert.deepEqual(mergeHeader(['Area', 'Task Detail'], header), [
    'Area',
    'Task Detail',
    ...header.filter((column) => column !== 'Area' && column !== 'Task Detail'),
  ]);
});

test('skips unchanged issue rows by repository and issue number sync key', () => {
  const item = issueItem(21, 'Keep existing row');
  const plan = planSheetSync({
    config,
    existingValues: [header, rowValues(item.row)],
    items: [item],
    nowIso: '2026-05-31T00:00:00Z',
    sheetName: config.sheetName,
  });

  assert.equal(plan.rowWrites.length, 0);
  assert.equal(plan.summary.skippedUnchangedRows, 1);
});

test('matches draft issue rows by project item id', () => {
  const item = normalizeProjectItem({
    content: {
      __typename: 'DraftIssue',
      title: 'Draft-only backlog item',
    },
    id: 'PVTI_draft_match',
  } satisfies ProjectItem);

  const plan = planSheetSync({
    config,
    existingValues: [header, rowValues(item.row)],
    items: [item],
    nowIso: '2026-05-31T00:00:00Z',
    sheetName: config.sheetName,
  });

  assert.equal(plan.rowWrites.length, 0);
  assert.equal(plan.summary.skippedUnchangedRows, 1);
});

test('plans inserts, updates, and archives without deleting rows', () => {
  const changedItem = issueItem(1, 'Current issue title');
  const oldChangedRow = {
    ...changedItem.row,
    'Sync Hash': 'old-hash',
    'Task Detail': 'Previous issue title',
  };
  const absentItem = issueItem(2, 'Removed from project');
  const newItem = issueItem(3, 'New project item');
  const nowIso = '2026-05-31T00:00:00Z';

  const plan = planSheetSync({
    config,
    existingValues: [header, rowValues(oldChangedRow), rowValues(absentItem.row)],
    items: [changedItem, newItem],
    nowIso,
    sheetName: config.sheetName,
  });

  assert.equal(plan.summary.updatedRows, 1);
  assert.equal(plan.summary.insertedRows, 1);
  assert.equal(plan.summary.archivedRows, 1);
  assert.deepEqual(
    plan.rowWrites.map((write) => write.kind),
    ['update', 'insert', 'archive'],
  );

  const archiveWrite = plan.rowWrites.find((write) => write.kind === 'archive');
  assert.ok(archiveWrite);
  assert.equal(archiveWrite.values[columnIndex('Archived')], 'TRUE');
  assert.equal(archiveWrite.values[columnIndex('Archived At')], nowIso);
});

test('does not re-archive rows that are already marked archived', () => {
  const archivedItem = issueItem(40, 'Already archived');
  const archivedRow = {
    ...archivedItem.row,
    Archived: 'TRUE',
    'Archived At': '2026-05-30T00:00:00Z',
  };

  const plan = planSheetSync({
    config,
    existingValues: [header, rowValues(archivedRow)],
    items: [],
    nowIso: '2026-05-31T00:00:00Z',
    sheetName: config.sheetName,
  });

  assert.equal(plan.summary.archivedRows, 0);
  assert.equal(plan.rowWrites.length, 0);
});

test('reactivates an archived row when the item appears in the project again', () => {
  const item = issueItem(50, 'Reopened project item');
  const staleArchivedRow = {
    ...item.row,
    Archived: 'TRUE',
    'Archived At': '2026-05-30T00:00:00Z',
  };

  const plan = planSheetSync({
    config,
    existingValues: [header, rowValues(staleArchivedRow)],
    items: [item],
    nowIso: '2026-05-31T00:00:00Z',
    sheetName: config.sheetName,
  });

  assert.equal(plan.summary.updatedRows, 1);
  assert.equal(plan.rowWrites[0]?.values[columnIndex('Archived')], 'FALSE');
  assert.equal(plan.rowWrites[0]?.values[columnIndex('Archived At')], '');
});

function columnIndex(columnName: ColumnName): number {
  return header.indexOf(columnName);
}

function issueItem(number: number, title: string): NormalizedProjectItem {
  return normalizeProjectItem({
    content: {
      __typename: 'Issue',
      assignees: { nodes: [{ login: 'alice' }] },
      number,
      repository: { nameWithOwner: 'nivx18818/rmap-app' },
      state: 'OPEN',
      title,
      url: `https://github.com/nivx18818/rmap-app/issues/${number}`,
    },
    id: `PVTI_${number}`,
  } satisfies ProjectItem);
}

function rowValues(row: RowData): string[] {
  return DEFAULT_COLUMNS.map((column) => row[column]);
}
