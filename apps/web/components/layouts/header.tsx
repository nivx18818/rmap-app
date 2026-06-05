'use client';
import type { Route } from 'next';

import {
  GithubIcon,
  Login01Icon,
  Logout02Icon,
  MapsIcon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons';
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
import { ProtectedLink } from '@/components/shared/protected-link';
import { useAuth } from '@/hooks/use-auth';

export function Header() {
  const router = useRouter();
  const { isAuthenticated, isLoading, signOut, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userFirstName = user?.fullName?.split(' ')[0];
  const userDashboardLabel = userFirstName ? `${userFirstName}'s Dashboard` : 'Dashboard';

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
    <header className="absolute inset-x-0 top-0 z-50 mx-auto flex max-w-300 items-center justify-between px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6.5">
      <Link className="flex items-center gap-2" href="/">
        <HugeiconsIcon className="size-7 sm:size-8" icon={MapsIcon} />
        <span className="font-heading text-xl font-bold tracking-[-0.5px] sm:text-2xl">RMap</span>
      </Link>

      {/* Navigation */}
      <div className="hidden lg:block">
        <NavigationMenu>
          <NavigationMenuList>
            {NAV_ITEMS.map((item) => (
              <NavigationMenuItem key={item.href} className="group relative">
                <NavigationMenuLink
                  render={
                    <ProtectedLink href={item.href as Route<string>}>{item.label}</ProtectedLink>
                  }
                />
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* CTA Button Group */}
      <div
        className="hidden items-center gap-1 rounded-full border border-white/50 p-1 shadow-sm md:flex"
        style={{ backgroundImage: 'var(--color-gradient-cta-pill)' }}
      >
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
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
              className="rounded-full"
              render={<Link href={'/sign-in' as Route<string>}>Login</Link>}
            />

            <Button
              size="sm"
              className="rounded-full"
              render={<Link href={'/sign-up' as Route<string>}>Get started</Link>}
            />
          </>
        )}

        {!isLoading && isAuthenticated && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              render={
                <ProtectedLink
                  className="flex items-center gap-2"
                  href={'/dashboard' as Route<string>}
                >
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
                  {userDashboardLabel}
                </ProtectedLink>
              }
            />

            <Button
              size="sm"
              className="rounded-full"
              disabled={isLoggingOut}
              onClick={handleSignOut}
            >
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
              {!isLoggingOut && <HugeiconsIcon className="size-4" icon={Logout02Icon} />}
            </Button>
          </>
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="rounded-full md:hidden"
        aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setIsMobileMenuOpen((prev) => !prev)}
      >
        {isMobileMenuOpen ? (
          <svg className="size-4" fill="none" aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg className="size-4" fill="none" aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </Button>

      {isMobileMenuOpen && (
        <div className="bg-background/95 absolute top-full right-4 left-4 mt-3 space-y-4 rounded-2xl border border-white/50 p-4 shadow-lg backdrop-blur-sm sm:right-6 sm:left-6">
          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <ProtectedLink
                key={item.href}
                className="hover:bg-primary/10 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                href={item.href as Route<string>}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </ProtectedLink>
            ))}
          </nav>

          {!isLoading && !isAuthenticated && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl"
                  aria-label="Star us on GitHub"
                  render={
                    <Link
                      className="flex w-full items-center gap-2"
                      href="https://github.com/nivx18818/rmap-app"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <HugeiconsIcon className="size-4" icon={GithubIcon} />
                      Star us
                    </Link>
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl"
                  render={
                    <Link href={'/sign-in' as Route<string>}>
                      Login
                      <HugeiconsIcon className="size-4" icon={Login01Icon} />
                    </Link>
                  }
                />
              </div>

              <Button
                size="sm"
                className="w-full rounded-xl"
                render={<Link href={'/sign-up' as Route<string>}>Get started</Link>}
              />
            </div>
          )}

          {!isLoading && isAuthenticated && (
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start rounded-xl"
                  aria-label="Star us on GitHub"
                  render={
                    <Link
                      className="flex w-full items-center gap-2"
                      href="https://github.com/nivx18818/rmap-app"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <HugeiconsIcon className="size-4" icon={GithubIcon} />
                      Star us
                    </Link>
                  }
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start rounded-xl"
                  render={
                    <ProtectedLink
                      className="flex w-full items-center gap-2"
                      href={'/dashboard' as Route<string>}
                    >
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
                      {userDashboardLabel}
                    </ProtectedLink>
                  }
                />
              </div>

              <Button
                size="sm"
                className="w-full rounded-xl"
                disabled={isLoggingOut}
                onClick={handleSignOut}
              >
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
                {!isLoggingOut && <HugeiconsIcon className="size-4" icon={Logout02Icon} />}
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
