import type { Metadata } from 'next';
import type { Route } from 'next';
import type { ReactNode } from 'react';

import { Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/design-system/components/ui/avatar';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { authServerData } from '@/server-fetcher/auth-server';

import { AdminBreadcrumbs, AdminNavigation } from './_components/admin-navigation';

export const metadata: Metadata = {
  title: 'Admin Console - RMap',
  description: 'Manage RMap content catalogs and roadmap templates.',
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await authServerData.getInitialUser();

  if (!user) {
    redirect('/sign-in?callbackUrl=/admin');
  }

  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="bg-background min-h-screen">
      <AdminNavigation />
      <div className="min-h-screen min-w-0 lg:ml-64">
        <header className="border-border/70 bg-background/90 sticky top-0 border-b backdrop-blur-xl">
          <div className="mx-auto flex h-auto w-full max-w-360 flex-col gap-4 px-4 py-4 sm:px-6 lg:h-18 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-0">
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-foreground text-xl font-semibold">Admin Console</h1>
              <AdminBreadcrumbs />
            </div>

            <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center">
              <div className="relative hidden w-full min-w-72 xl:block">
                <HugeiconsIcon
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                  icon={Search01Icon}
                />
                <Input
                  className="bg-card/80 pl-10"
                  placeholder="Search skills, resources, roadmaps..."
                  aria-label="Search admin content"
                />
              </div>

              <div className="flex items-center justify-between gap-3 md:justify-end">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar size="lg">
                    {user.avatarUrl ? (
                      <AvatarImage alt={user.fullName} src={user.avatarUrl} />
                    ) : null}
                    <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden min-w-0 flex-col sm:flex">
                    <span className="truncate text-sm font-medium">{user.fullName}</span>
                    <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                  </div>
                  <Badge variant="secondary" className="hidden sm:inline-flex">
                    Admin
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={'/dashboard' as Route<string>}>Back to app</Link>}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-360 min-w-0 px-4 py-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'A'
  );
}
