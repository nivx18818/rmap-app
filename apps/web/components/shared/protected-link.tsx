'use client';

import type { Route } from 'next';
import type { ComponentPropsWithoutRef, MouseEvent } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/use-auth';
import {
  getSignInPath,
  isProtectedAppRoute,
  savePendingAuthRedirectPath,
} from '@/utils/auth-redirect';

type ProtectedLinkProps = ComponentPropsWithoutRef<typeof Link>;

export function ProtectedLink({ href, onClick, ...props }: ProtectedLinkProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const hrefValue = href.toString();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (event.defaultPrevented || isAuthenticated || !isProtectedAppRoute(hrefValue)) {
      return;
    }

    event.preventDefault();
    savePendingAuthRedirectPath(hrefValue);
    router.push(getSignInPath(hrefValue) as Route<string>);
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
