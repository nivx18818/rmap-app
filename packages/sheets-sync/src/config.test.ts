import { strict as assert } from 'node:assert';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';

import { loadRuntimeConfig, loadSyncConfig } from './config.js';

test('validates required runtime environment values', () => {
  assert.throws(() => loadRuntimeConfig({}), /Invalid sheets sync environment.*GH_PROJECT_TOKEN/);
});

test('parses runtime environment values without exposing secret contents', () => {
  const runtimeConfig = loadRuntimeConfig({
    GH_PROJECT_TOKEN: 'github-token',
    GOOGLE_SERVICE_ACCOUNT_KEY: JSON.stringify({
      client_email: 'sheets-sync@example.iam.gserviceaccount.com',
      private_key: 'private-key',
    }),
    SHEET_ID: 'spreadsheet-id',
    SHEET_TAB_NAME: 'Custom Backlog',
    SYNC_DRY_RUN: 'true',
  });

  assert.equal(runtimeConfig.dryRun, true);
  assert.equal(runtimeConfig.sheetId, 'spreadsheet-id');
  assert.equal(runtimeConfig.sheetTabName, 'Custom Backlog');
  assert.equal(
    runtimeConfig.googleServiceAccountKey.client_email,
    'sheets-sync@example.iam.gserviceaccount.com',
  );
});

test('rejects malformed Google service account JSON', () => {
  assert.throws(
    () =>
      loadRuntimeConfig({
        GH_PROJECT_TOKEN: 'github-token',
        GOOGLE_SERVICE_ACCOUNT_KEY: '{',
        SHEET_ID: 'spreadsheet-id',
      }),
    /GOOGLE_SERVICE_ACCOUNT_KEY must be valid JSON/,
  );
});

test('reports config validation errors with field paths', async () => {
  const tempDirectory = await mkdtemp(join(process.cwd(), 'tmp-sheets-sync-'));
  const configPath = join(tempDirectory, 'bad-config.json');

  try {
    await writeFile(
      configPath,
      JSON.stringify({
        metadataColumns: [],
        projectNumber: 0,
        projectOwner: '',
        projectOwnerType: 'TEAM',
        sheetName: '',
        visibleColumns: ['Area'],
      }),
      'utf8',
    );

    await assert.rejects(loadSyncConfig(configPath), /Invalid sheets sync config.*projectOwner/);
  } finally {
    await rm(tempDirectory, { force: true, recursive: true });
  }
});
