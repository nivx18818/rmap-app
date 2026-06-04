import { API_BASE_PATH, ENDPOINTS } from '@/constants/endpoints';

type OAuthProvider = keyof typeof ENDPOINTS.auth.oauth;

export function getSafeCallbackUrl(): string {
  if (typeof window === 'undefined') {
    return '/';
  }

  const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
  if (!callbackUrl || !callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
    return '/';
  }

  try {
    const url = new URL(callbackUrl, window.location.origin);
    if (url.origin !== window.location.origin) {
      return '/';
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

export function buildOAuthLoginUrl(provider: OAuthProvider): string {
  const path = `${API_BASE_PATH}${ENDPOINTS.auth.oauth[provider]}`;

  if (typeof window === 'undefined') {
    return path;
  }

  const url = new URL(path, window.location.origin);
  const callbackUrl = getSafeCallbackUrl();
  if (callbackUrl !== '/') {
    url.searchParams.set('callbackUrl', callbackUrl);
  }

  return `${url.pathname}${url.search}`;
}
