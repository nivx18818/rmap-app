import { loadRuntimeConfig, loadSyncConfig } from './config.js';
import { fetchProjectItems } from './github.js';
import { normalizeProjectItem } from './normalize.js';
import { planSheetSync } from './plan.js';
import { applySheetPlan, createGoogleSheetsValuesApi, readSheetValues } from './sheets.js';

async function main(): Promise<void> {
  const config = await loadSyncConfig();
  const runtimeConfig = loadRuntimeConfig(process.env);
  const sheetName = runtimeConfig.sheetTabName ?? config.sheetName;
  const valuesApi = createGoogleSheetsValuesApi(runtimeConfig.googleServiceAccountKey);
  const projectItems = await fetchProjectItems({
    config,
    token: runtimeConfig.githubToken,
  });
  const normalizedItems = projectItems.map((item) => normalizeProjectItem(item));
  const existingValues = await readSheetValues({
    sheetName,
    spreadsheetId: runtimeConfig.sheetId,
    valuesApi,
  });
  const plan = planSheetSync({
    config,
    existingValues,
    items: normalizedItems,
    nowIso: new Date().toISOString(),
    sheetName,
  });

  if (runtimeConfig.dryRun) {
    console.info('SYNC_DRY_RUN=true; no Google Sheets writes were made.');
  } else {
    await applySheetPlan({
      plan,
      sheetName,
      spreadsheetId: runtimeConfig.sheetId,
      valuesApi,
    });
  }

  console.info(
    [
      `Sheets sync summary for "${sheetName}":`,
      `fetched=${plan.summary.fetchedItems}`,
      `inserted=${plan.summary.insertedRows}`,
      `updated=${plan.summary.updatedRows}`,
      `archived=${plan.summary.archivedRows}`,
      `skipped=${plan.summary.skippedUnchangedRows}`,
      `headerUpdated=${String(plan.summary.headerUpdated)}`,
    ].join(' '),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown sheets sync failure.';
  console.error(message);
  process.exitCode = 1;
});
