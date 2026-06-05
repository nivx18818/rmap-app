import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { getSafeAuthRedirectPath, isProtectedAppRoute } from '@/utils/auth-redirect';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname, search } = request.nextUrl;

  const authRoutes = ['/sign-in', '/sign-up'];

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedAppRoute(pathname) && !token) {
    const url = new URL('/sign-in', request.url);
    url.searchParams.set('callbackUrl', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && token) {
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
    return NextResponse.redirect(new URL(getSafeAuthRedirectPath(callbackUrl), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/roadmaps/generate',
    '/roadmaps/generate/:path*',
    '/sign-in',
    '/sign-up',
  ],
};
