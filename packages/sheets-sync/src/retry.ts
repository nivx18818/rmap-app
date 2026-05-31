import { setTimeout as sleepTimeout } from 'node:timers/promises';

export interface RetryOptions {
  baseDelayMs?: number;
  jitter?: boolean;
  maxAttempts?: number;
  maxDelayMs?: number;
  random?: () => number;
  shouldRetry?: (error: unknown) => boolean;
  sleep?: (delayMs: number) => Promise<void>;
}

interface RetryableRequestErrorOptions {
  headers?: unknown;
  retryAfterMs?: number;
  status?: number;
}

export class RetryableRequestError extends Error {
  readonly headers?: unknown;
  readonly retryAfterMs?: number;
  readonly status?: number;

  constructor(message: string, options: RetryableRequestErrorOptions = {}) {
    super(message);
    this.name = 'RetryableRequestError';
    this.headers = options.headers;
    this.retryAfterMs = options.retryAfterMs;
    this.status = options.status;
  }
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 4;
  const sleep = options.sleep ?? sleepTimeout;
  const shouldRetry = options.shouldRetry ?? isRetryableError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      await sleep(getRetryDelayMs(error, attempt, options));
    }
  }

  throw new Error('Retry operation exhausted without returning or throwing.');
}

export function isRetryableError(error: unknown): boolean {
  const status = getErrorStatus(error);

  if (status === undefined) {
    return false;
  }

  if (status === 429 || status >= 500) {
    return true;
  }

  if (status !== 403) {
    return false;
  }

  const headers = getErrorHeaders(error);
  return (
    getRetryAfterMs(headers) !== undefined ||
    getHeaderValue(headers, 'x-ratelimit-remaining') === '0'
  );
}

export function getRetryAfterMs(headers: unknown, nowMs = Date.now()): number | undefined {
  const retryAfter = getHeaderValue(headers, 'retry-after');

  if (retryAfter === undefined) {
    const resetAt = getHeaderValue(headers, 'x-ratelimit-reset');
    const resetUnixSeconds = resetAt === undefined ? Number.NaN : Number(resetAt);

    if (Number.isFinite(resetUnixSeconds)) {
      return Math.max(0, resetUnixSeconds * 1000 - nowMs);
    }

    return undefined;
  }

  const retryAfterSeconds = Number(retryAfter);

  if (Number.isFinite(retryAfterSeconds)) {
    return Math.max(0, retryAfterSeconds * 1000);
  }

  const retryAfterDateMs = Date.parse(retryAfter);
  return Number.isNaN(retryAfterDateMs) ? undefined : Math.max(0, retryAfterDateMs - nowMs);
}

function getRetryDelayMs(error: unknown, attempt: number, options: RetryOptions): number {
  const retryAfterMs =
    error instanceof RetryableRequestError && error.retryAfterMs !== undefined
      ? error.retryAfterMs
      : getRetryAfterMs(getErrorHeaders(error));

  if (retryAfterMs !== undefined) {
    return Math.min(retryAfterMs, options.maxDelayMs ?? 30_000);
  }

  const baseDelayMs = options.baseDelayMs ?? 500;
  const maxDelayMs = options.maxDelayMs ?? 30_000;
  const exponentialDelayMs = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);

  if (options.jitter === false) {
    return exponentialDelayMs;
  }

  const random = options.random ?? Math.random;
  return Math.min(maxDelayMs, exponentialDelayMs + Math.floor(exponentialDelayMs * 0.2 * random()));
}

function getErrorHeaders(error: unknown): unknown {
  if (error instanceof RetryableRequestError) {
    return error.headers;
  }

  if (!isRecord(error) || !isRecord(error.response)) {
    return undefined;
  }

  return error.response.headers;
}

function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof RetryableRequestError) {
    return error.status;
  }

  if (!isRecord(error) || !isRecord(error.response)) {
    return undefined;
  }

  return typeof error.response.status === 'number' ? error.response.status : undefined;
}

function getHeaderValue(headers: unknown, headerName: string): string | undefined {
  if (headers === undefined || headers === null) {
    return undefined;
  }

  if (isHeadersLike(headers)) {
    return headers.get(headerName) ?? undefined;
  }

  if (!isRecord(headers)) {
    return undefined;
  }

  const normalizedHeaderName = headerName.toLowerCase();
  const headerEntry = Object.entries(headers).find(
    ([key]) => key.toLowerCase() === normalizedHeaderName,
  );
  const value = headerEntry?.[1];

  if (Array.isArray(value)) {
    const firstValue = value[0];
    return typeof firstValue === 'string' ? firstValue : undefined;
  }

  return typeof value === 'string' ? value : undefined;
}

function isHeadersLike(value: unknown): value is Pick<Headers, 'get'> {
  return isRecord(value) && typeof value.get === 'function';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
