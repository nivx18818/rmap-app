import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { z } from 'zod';

import {
  DEFAULT_COLUMNS,
  type GoogleServiceAccountKey,
  type RuntimeConfig,
  type SyncConfig,
} from './types.js';

const columnSchema = z.enum(DEFAULT_COLUMNS);

const syncConfigSchema = z.object({
  metadataColumns: z.array(columnSchema).min(1),
  projectNumber: z.number().int().positive(),
  projectOwner: z.string().min(1),
  projectOwnerType: z.enum(['USER', 'ORGANIZATION']),
  sheetName: z.string().min(1),
  visibleColumns: z.array(columnSchema).min(1),
});

const serviceAccountSchema = z
  .object({
    client_email: z.string().min(1),
    private_key: z.string().min(1),
  })
  .passthrough();

const runtimeEnvSchema = z.object({
  GH_PROJECT_TOKEN: z.string().min(1),
  GOOGLE_SERVICE_ACCOUNT_KEY: z.string().min(1),
  SHEET_ID: z.string().min(1),
  SHEET_TAB_NAME: z.string().min(1).optional(),
  SYNC_DRY_RUN: z.string().optional(),
});

export async function loadSyncConfig(configPath?: string): Promise<SyncConfig> {
  const resolvedConfigPath =
    configPath === undefined ? await findConfigPath() : resolve(configPath);
  const rawConfig = JSON.parse(await readFile(resolvedConfigPath, 'utf8')) as unknown;
  const parseResult = syncConfigSchema.safeParse(rawConfig);

  if (!parseResult.success) {
    throw new Error(`Invalid sheets sync config: ${formatZodIssues(parseResult.error)}`);
  }

  return parseResult.data;
}

export function loadRuntimeConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  const parseResult = runtimeEnvSchema.safeParse({
    GH_PROJECT_TOKEN: normalizeEnvValue(env.GH_PROJECT_TOKEN),
    GOOGLE_SERVICE_ACCOUNT_KEY: normalizeEnvValue(env.GOOGLE_SERVICE_ACCOUNT_KEY),
    SHEET_ID: normalizeEnvValue(env.SHEET_ID),
    SHEET_TAB_NAME: normalizeEnvValue(env.SHEET_TAB_NAME),
    SYNC_DRY_RUN: normalizeEnvValue(env.SYNC_DRY_RUN),
  });

  if (!parseResult.success) {
    throw new Error(`Invalid sheets sync environment: ${formatZodIssues(parseResult.error)}`);
  }

  return {
    dryRun: parseBoolean(parseResult.data.SYNC_DRY_RUN),
    githubToken: parseResult.data.GH_PROJECT_TOKEN,
    googleServiceAccountKey: parseGoogleServiceAccountKey(
      parseResult.data.GOOGLE_SERVICE_ACCOUNT_KEY,
    ),
    sheetId: parseResult.data.SHEET_ID,
    sheetTabName: parseResult.data.SHEET_TAB_NAME,
  };
}

export async function findConfigPath(startDirectory = process.cwd()): Promise<string> {
  let currentDirectory = resolve(startDirectory);

  while (true) {
    const candidate = join(currentDirectory, '.github', 'sheets-sync.config.json');

    try {
      await access(candidate);
      return candidate;
    } catch {
      const parentDirectory = dirname(currentDirectory);

      if (parentDirectory === currentDirectory) {
        throw new Error(
          'Could not find .github/sheets-sync.config.json from the current directory.',
        );
      }

      currentDirectory = parentDirectory;
    }
  }
}

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
    .join('; ');
}

function normalizeEnvValue(value: string | undefined): string | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }

  return value;
}

function parseBoolean(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

function parseGoogleServiceAccountKey(rawKey: string): GoogleServiceAccountKey {
  let parsedKey: unknown;

  try {
    parsedKey = JSON.parse(rawKey) as unknown;
  } catch {
    throw new Error(
      'Invalid sheets sync environment: GOOGLE_SERVICE_ACCOUNT_KEY must be valid JSON.',
    );
  }

  const parseResult = serviceAccountSchema.safeParse(parsedKey);

  if (!parseResult.success) {
    throw new Error(
      `Invalid sheets sync environment: GOOGLE_SERVICE_ACCOUNT_KEY ${formatZodIssues(
        parseResult.error,
      )}`,
    );
  }

  return parseResult.data;
}
