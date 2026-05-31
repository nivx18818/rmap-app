import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import type { SyncPlan } from './plan.js';

import { applySheetPlan, readSheetValues, type SheetsValuesApi } from './sheets.js';

test('retries retryable Google Sheets read failures', async () => {
  let attempts = 0;
  const valuesApi = {
    get: () => {
      attempts += 1;

      if (attempts === 1) {
        throw {
          response: {
            headers: {},
            status: 500,
          },
        };
      }

      return Promise.resolve({
        data: {
          values: [['Area']],
        },
      });
    },
  } as unknown as SheetsValuesApi;

  const values = await readSheetValues({
    sheetName: 'Sprint Backlog Tracker',
    spreadsheetId: 'spreadsheet-id',
    valuesApi,
  });

  assert.deepEqual(values, [['Area']]);
  assert.equal(attempts, 2);
});

test('writes planned header and row changes through values.batchUpdate', async () => {
  let requestBody: unknown;
  const valuesApi = {
    batchUpdate: (params: { requestBody?: unknown }) => {
      requestBody = params.requestBody;
      return Promise.resolve({ data: {} });
    },
  } as unknown as SheetsValuesApi;
  const plan: SyncPlan = {
    headerWrite: {
      range: "'Sprint Backlog Tracker'!A1:B1",
      values: ['Area', 'Task Detail'],
    },
    rowWrites: [
      {
        kind: 'insert',
        range: "'Sprint Backlog Tracker'!A2:B2",
        rowNumber: 2,
        values: ['API', 'Create auth endpoint'],
      },
    ],
    summary: {
      archivedRows: 0,
      fetchedItems: 1,
      headerUpdated: true,
      insertedRows: 1,
      skippedUnchangedRows: 0,
      updatedRows: 0,
    },
  };

  await applySheetPlan({
    plan,
    sheetName: 'Sprint Backlog Tracker',
    spreadsheetId: 'spreadsheet-id',
    valuesApi,
  });

  assert.deepEqual(requestBody, {
    data: [
      {
        range: "'Sprint Backlog Tracker'!A1:B1",
        values: [['Area', 'Task Detail']],
      },
      {
        range: "'Sprint Backlog Tracker'!A2:B2",
        values: [['API', 'Create auth endpoint']],
      },
    ],
    valueInputOption: 'RAW',
  });
});
