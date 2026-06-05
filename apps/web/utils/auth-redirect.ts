const DEFAULT_AUTH_REDIRECT_PATH = '/';
const AUTH_REDIRECT_STORAGE_KEY = 'rmap:auth-redirect';
const AUTH_REDIRECT_STORAGE_TTL_MS = 10 * 60 * 1000;

interface StoredAuthRedirect {
  createdAt: number;
  path: string;
}

export const PROTECTED_APP_ROUTES = ['/dashboard', '/roadmaps/generate'] as const;

export function isProtectedAppRoute(path: string) {
  return PROTECTED_APP_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

export function getSafeAuthRedirectPath(callbackUrl: null | string | undefined) {
  if (!callbackUrl || !callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  try {
    const url = new URL(callbackUrl, 'http://rmap.local');

    if (url.origin !== 'http://rmap.local') {
      return DEFAULT_AUTH_REDIRECT_PATH;
    }

    if (url.pathname === '/sign-in' || url.pathname === '/sign-up') {
      return DEFAULT_AUTH_REDIRECT_PATH;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }
}

export function getSignInPath(callbackUrl: string) {
  const safeCallbackUrl = getSafeAuthRedirectPath(callbackUrl);
  const params = new URLSearchParams({ callbackUrl: safeCallbackUrl });

  return `/sign-in?${params.toString()}`;
}

export function savePendingAuthRedirectPath(callbackUrl: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const safeCallbackUrl = getSafeAuthRedirectPath(callbackUrl);

  if (safeCallbackUrl === DEFAULT_AUTH_REDIRECT_PATH) {
    return;
  }

  const value: StoredAuthRedirect = {
    createdAt: Date.now(),
    path: safeCallbackUrl,
  };

  window.sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, JSON.stringify(value));
}

export function consumeAuthRedirectPath(callbackUrl: null | string | undefined) {
  const safeCallbackUrl = getSafeAuthRedirectPath(callbackUrl);

  if (safeCallbackUrl !== DEFAULT_AUTH_REDIRECT_PATH) {
    clearPendingAuthRedirectPath();
    return safeCallbackUrl;
  }

  const storedPath = getPendingAuthRedirectPath();
  clearPendingAuthRedirectPath();

  return storedPath ?? DEFAULT_AUTH_REDIRECT_PATH;
}

function clearPendingAuthRedirectPath() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
}

function getPendingAuthRedirectPath() {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedValue = window.sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Partial<StoredAuthRedirect>;
    const isExpired =
      typeof parsedValue.createdAt !== 'number' ||
      Date.now() - parsedValue.createdAt > AUTH_REDIRECT_STORAGE_TTL_MS;

    if (isExpired) {
      return null;
    }

    const safePath = getSafeAuthRedirectPath(parsedValue.path);

    return safePath === DEFAULT_AUTH_REDIRECT_PATH ? null : safePath;
  } catch {
    return null;
  }
}
