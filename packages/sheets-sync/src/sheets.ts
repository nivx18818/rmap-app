import { google, type sheets_v4 } from 'googleapis';

import type { SyncPlan } from './plan.js';
import type { GoogleServiceAccountKey } from './types.js';

import { quoteSheetName } from './plan.js';
import { retryOperation } from './retry.js';

export type SheetsValuesApi = Pick<sheets_v4.Resource$Spreadsheets$Values, 'batchUpdate' | 'get'>;

interface SheetOperationInput {
  sheetName: string;
  spreadsheetId: string;
  valuesApi: SheetsValuesApi;
}

export function createGoogleSheetsValuesApi(credentials: GoogleServiceAccountKey): SheetsValuesApi {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ auth, version: 'v4' }).spreadsheets.values;
}

export async function readSheetValues(input: SheetOperationInput): Promise<string[][]> {
  const response = await retryOperation(() =>
    input.valuesApi.get({
      range: `${quoteSheetName(input.sheetName)}!A:ZZ`,
      spreadsheetId: input.spreadsheetId,
    }),
  );

  return response.data.values ?? [];
}

export async function applySheetPlan(
  input: SheetOperationInput & {
    plan: SyncPlan;
  },
): Promise<void> {
  const data = [
    ...(input.plan.headerWrite === undefined
      ? []
      : [
          {
            range: input.plan.headerWrite.range,
            values: [input.plan.headerWrite.values],
          },
        ]),
    ...input.plan.rowWrites.map((write) => ({
      range: write.range,
      values: [write.values],
    })),
  ];

  if (data.length === 0) {
    return;
  }

  await retryOperation(() =>
    input.valuesApi.batchUpdate({
      requestBody: {
        data,
        valueInputOption: 'RAW',
      },
      spreadsheetId: input.spreadsheetId,
    }),
  );
}
