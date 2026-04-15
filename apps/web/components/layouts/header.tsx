'use client';
import type { Route } from 'next';

import { GithubIcon, Logout02Icon, MapsIcon, UserCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@repo/design-system/components/ui/navigation-menu';
import { toast } from '@repo/design-system/lib/toast';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { NAV_ITEMS } from '@/app/(full-layout)/(home)/_data/landing';
import { useAuth } from '@/hooks/use-auth';

export function Header() {
  const router = useRouter();
  const { isAuthenticated, isLoading, signOut, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);

    try {
      await signOut();
      toast.success('Logout successfully');
      router.push('/');
    } catch {
      toast.error('Sign out failed', {
        description: 'Please try again.',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="absolute inset-x-0 top-0 z-50 mx-auto flex max-w-300 items-center justify-between px-8 py-6.5">
      <Link className="flex items-center gap-2" href="/">
        <HugeiconsIcon className="size-8" icon={MapsIcon} />
        <span className="font-heading text-2xl font-bold tracking-[-0.5px]">RMap</span>
      </Link>

      {/* Navigation */}
      <NavigationMenu>
        <NavigationMenuList>
          {NAV_ITEMS.map((item) => (
            <NavigationMenuItem key={item.href} className="group relative">
              <NavigationMenuLink
                render={<Link href={item.href as Route<string>}>{item.label}</Link>}
              />
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      {/* CTA Button Group */}
      <div
        className="flex items-center gap-1 rounded-full border border-white/50 p-1 shadow-sm"
        style={{ backgroundImage: 'var(--color-gradient-cta-pill)' }}
      >
        <Button
          variant="outline"
          size="sm"
          className="rounded-l-full!"
          aria-label="Star us on GitHub"
          render={
            <Link
              className="flex items-center gap-2"
              href="https://github.com/nivx18818/rmap-app"
              rel="noopener noreferrer"
              target="_blank"
            >
              <HugeiconsIcon className="size-4" icon={GithubIcon} />
              Star us
            </Link>
          }
        />

        {!isLoading && !isAuthenticated && (
          <>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={'/sign-in' as Route<string>}>Login</Link>}
            />
            <Button
              size="sm"
              className="rounded-full rounded-l-md"
              render={<Link href={'/sign-up' as Route<string>}>Get started</Link>}
            />
          </>
        )}

        {!isLoading && isAuthenticated && (
          <>
            <Button
              variant="outline"
              size="sm"
              render={
                <Link className="flex items-center gap-2" href={'/ai' as Route<string>}>
                  {user?.avatarUrl ? (
                    <Image
                      className="size-6 rounded-full object-cover"
                      src={user.avatarUrl}
                      alt={user.fullName}
                      width={20}
                      height={20}
                      unoptimized
                    />
                  ) : (
                    <HugeiconsIcon className="size-4" icon={UserCircleIcon} />
                  )}
                  {user?.fullName?.split(' ')[0] ?? 'My Account'}
                </Link>
              }
            />

            <Button
              size="sm"
              className="rounded-l-md rounded-r-full"
              disabled={isLoggingOut}
              onClick={handleSignOut}
            >
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
              {!isLoggingOut && <HugeiconsIcon className="size-4" icon={Logout02Icon} />}
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
