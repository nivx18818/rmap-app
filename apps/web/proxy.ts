import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { API_BASE_PATH, ENDPOINTS } from '@/constants/endpoints';

const API_PROXY_ORIGIN = process.env.API_PROXY_ORIGIN ?? 'http://localhost:3001';
const EXPIRY_SKEW_SECONDS = 5;

type JwtPayload = {
  exp?: unknown;
};

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const { pathname, search } = request.nextUrl;

  const protectedRoutes = ['/admin', '/dashboard', '/profile', '/roadmaps/generate'];
  const authRoutes = ['/sign-in', '/sign-up'];

  const isProtectedRoute = protectedRoutes.some((route) => matchesRoute(pathname, route));
  const isAuthRoute = authRoutes.some((route) => matchesRoute(pathname, route));
  const hasValidAccessToken = isAccessTokenUsable(token);

  if (hasValidAccessToken) {
    if (isAuthRoute) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  if (isAuthRoute) {
    const refreshedResponse = await refreshSession(request, refreshToken, {
      redirectTo: new URL('/', request.url),
    });
    if (refreshedResponse) {
      return refreshedResponse;
    }

    return NextResponse.next();
  }

  const refreshedResponse = await refreshSession(request, refreshToken);
  if (refreshedResponse) {
    return refreshedResponse;
  }

  if (isProtectedRoute) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('callbackUrl', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

async function refreshSession(
  request: NextRequest,
  refreshToken: string | undefined,
  options: { redirectTo?: URL } = {},
) {
  if (!refreshToken) {
    return null;
  }

  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }

  let refreshResponse: Response;

  try {
    refreshResponse = await fetch(`${API_PROXY_ORIGIN}${API_BASE_PATH}${ENDPOINTS.auth.refresh}`, {
      cache: 'no-store',
      headers: {
        Cookie: cookieHeader,
      },
      method: 'POST',
    });
  } catch {
    return null;
  }

  if (!refreshResponse.ok) {
    return null;
  }

  const setCookieHeaders = getSetCookieHeaders(refreshResponse.headers);
  const response = options.redirectTo
    ? NextResponse.redirect(options.redirectTo)
    : NextResponse.next({
        request: {
          headers: getRefreshedRequestHeaders(request, setCookieHeaders),
        },
      });

  setCookieHeaders.forEach((cookie) => {
    response.headers.append('Set-Cookie', cookie);
  });

  return response;
}

function isAccessTokenUsable(token: string | undefined) {
  if (!token) {
    return false;
  }

  const expiresAt = getJwtExpiration(token);
  if (!expiresAt) {
    return false;
  }

  return expiresAt > Math.floor(Date.now() / 1000) + EXPIRY_SKEW_SECONDS;
}

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function getJwtExpiration(token: string) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return null;
  }

  return payload.exp;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const payload = token.split('.')[1];
  if (!payload) {
    return null;
  }

  const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
  const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');

  try {
    const decodedPayload = JSON.parse(atob(paddedPayload)) as unknown;
    if (!decodedPayload || typeof decodedPayload !== 'object') {
      return null;
    }

    return decodedPayload as JwtPayload;
  } catch {
    return null;
  }
}

function getSetCookieHeaders(headers: Headers) {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  if (getSetCookie) {
    return getSetCookie.call(headers);
  }

  const setCookie = headers.get('set-cookie');
  return setCookie ? splitSetCookieHeader(setCookie) : [];
}

function splitSetCookieHeader(header: string) {
  return header.split(/,(?=\s*[\w!#$%&'*+.^`|~-]+=)/);
}

function getRefreshedRequestHeaders(request: NextRequest, setCookieHeaders: string[]) {
  const headers = new Headers(request.headers);
  const currentCookieHeader = headers.get('cookie') ?? '';
  headers.set('cookie', mergeCookieHeader(currentCookieHeader, setCookieHeaders));

  return headers;
}

function mergeCookieHeader(cookieHeader: string, setCookieHeaders: string[]) {
  const cookies = new Map<string, string>();

  cookieHeader.split(';').forEach((cookie) => {
    const separatorIndex = cookie.indexOf('=');
    if (separatorIndex === -1) {
      return;
    }

    const name = cookie.slice(0, separatorIndex).trim();
    const value = cookie.slice(separatorIndex + 1).trim();
    if (name) {
      cookies.set(name, value);
    }
  });

  setCookieHeaders.forEach((setCookie) => {
    const [cookiePair = '', ...attributes] = setCookie.split(';');
    if (!cookiePair) {
      return;
    }

    const separatorIndex = cookiePair.indexOf('=');
    if (separatorIndex === -1) {
      return;
    }

    const name = cookiePair.slice(0, separatorIndex).trim();
    const value = cookiePair.slice(separatorIndex + 1).trim();
    const isExpired = attributes.some(
      (attribute) => attribute.trim().toLowerCase() === 'max-age=0',
    );

    if (!name) {
      return;
    }

    if (!value || isExpired) {
      cookies.delete(name);
      return;
    }

    cookies.set(name, value);
  });

  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
