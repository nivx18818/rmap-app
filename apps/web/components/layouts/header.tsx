'use client';
import type { Route } from 'next';

import {
  DashboardBrowsingIcon,
  GithubIcon,
  Logout02Icon,
  MapsIcon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/design-system/components/ui/dropdown-menu';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userFirstName = user?.fullName?.split(' ')[0];
  const userButtonLabel = userFirstName ? `${userFirstName}'s Profile` : 'My Profile';

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

  const userMenuTrigger = (
    <Button variant="outline" size="sm" className="rounded-r-[20px]">
      {user?.avatarUrl ? (
        <Image
          className="size-6 object-cover"
          src={user.avatarUrl}
          alt={user.fullName}
          width={20}
          height={20}
          unoptimized
        />
      ) : (
        <HugeiconsIcon className="size-4" icon={UserCircleIcon} />
      )}
      {userButtonLabel}
    </Button>
  );

  const userMenuContent = (
    <DropdownMenuContent className="w-44" align="end">
      <DropdownMenuItem render={<Link href={'/dashboard' as Route<string>} />}>
        <HugeiconsIcon className="size-4" icon={DashboardBrowsingIcon} />
        Dashboard
      </DropdownMenuItem>
      <DropdownMenuItem render={<Link href={'/profile' as Route<string>} />}>
        <HugeiconsIcon className="size-4" icon={UserCircleIcon} />
        Profile
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" disabled={isLoggingOut} onClick={handleSignOut}>
        <HugeiconsIcon className="size-4" icon={Logout02Icon} />
        {isLoggingOut ? 'Signing out...' : 'Sign out'}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

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
                  render={<Link href={item.href as Route<string>}>{item.label}</Link>}
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
          className="rounded-l-[20px]"
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
          <Button
            size="sm"
            className="rounded-r-[20px]"
            render={<Link href={'/sign-in' as Route<string>}>Get started</Link>}
          />
        )}

        {!isLoading && isAuthenticated && (
          <DropdownMenu>
            <DropdownMenuTrigger render={userMenuTrigger} />
            {userMenuContent}
          </DropdownMenu>
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
              <Link
                key={item.href}
                className="hover:bg-primary/10 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                href={item.href as Route<string>}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {!isLoading && !isAuthenticated && (
            <div className="flex flex-col gap-2">
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
                size="sm"
                className="w-full rounded-xl"
                render={<Link href={'/sign-in' as Route<string>}>Get started</Link>}
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
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start rounded-xl"
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
                        {userButtonLabel}
                      </Button>
                    }
                  />
                  <DropdownMenuContent className="w-44" align="end">
                    <DropdownMenuItem
                      render={<Link href={'/dashboard' as Route<string>} />}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <HugeiconsIcon className="size-4" icon={MapsIcon} />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<Link href={'/profile' as Route<string>} />}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <HugeiconsIcon className="size-4" icon={UserCircleIcon} />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={isLoggingOut}
                      onClick={handleSignOut}
                    >
                      <HugeiconsIcon className="size-4" icon={Logout02Icon} />
                      {isLoggingOut ? 'Signing out...' : 'Sign out'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
