import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TEST_ENV_FILE = '.env.test.local';
const DEFAULT_ENV_FILE = '.env';
const SAFE_SCHEMA_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

function loadEnvFile(fileName: string, override: boolean): void {
  const filePath = resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    return;
  }

  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^(['"])(.*)\1$/, '$2');

    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(TEST_ENV_FILE, true);
loadEnvFile(DEFAULT_ENV_FILE, false);

const integrationSchema = process.env.INTEGRATION_DATABASE_SCHEMA;
const databaseUrl = process.env.DATABASE_URL;

if (integrationSchema) {
  if (
    !SAFE_SCHEMA_PATTERN.test(integrationSchema) ||
    !integrationSchema.toLowerCase().includes('test')
  ) {
    throw new Error('INTEGRATION_DATABASE_SCHEMA must be a valid schema name containing "test".');
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required when INTEGRATION_DATABASE_SCHEMA is configured.');
  }

  const integrationDatabaseUrl = new URL(databaseUrl);
  integrationDatabaseUrl.searchParams.set('schema', integrationSchema);
  process.env.DATABASE_URL = integrationDatabaseUrl.toString();
}
