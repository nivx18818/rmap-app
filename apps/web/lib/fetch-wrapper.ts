import 'server-only';

import { API_BASE_PATH } from '@/constants/endpoints';

const API_PROXY_ORIGIN = process.env.API_PROXY_ORIGIN ?? 'http://localhost:3001';

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

export interface FetchWrapperOptions extends Omit<RequestInit, 'cache'> {
  cache?: RequestCache;
  next?: RequestInit['next'];
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function parseError(response: Response) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export async function fetchWrapper<T>(
  path: string,
  { headers, ...options }: FetchWrapperOptions = {},
): Promise<T> {
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Content-Type') && options.body) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_PROXY_ORIGIN}${API_BASE_PATH}${path}`, {
    ...options,
    credentials: 'include',
    headers: requestHeaders,
  });

  if (!response.ok) {
    throw new FetchError(
      `Request failed with status ${response.status}`,
      response.status,
      await parseError(response),
    );
  }

  return parseResponse<T>(response);
}
