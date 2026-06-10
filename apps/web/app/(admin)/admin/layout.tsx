import type { Metadata } from 'next';
import type { Route } from 'next';
import type { ReactNode } from 'react';

import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { Separator } from '@repo/design-system/components/ui/separator';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { authServerData } from '@/server-fetcher/auth-server';

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
    <div className="bg-background relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 12%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 30%), radial-gradient(circle at 88% 0%, color-mix(in srgb, var(--chart-2) 16%, transparent), transparent 24%), linear-gradient(135deg, var(--background), var(--muted))',
        }}
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-360 flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="border-border/70 bg-background/80 flex flex-col gap-4 rounded-3xl border p-4 shadow-sm backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <Link className="font-heading text-foreground w-fit text-2xl font-bold" href="/">
              RMap Admin
            </Link>
            <p className="text-muted-foreground text-sm">
              Course content operations for skills, resources, and templates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{user.fullName}</Badge>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={'/dashboard' as Route<string>}>Back to app</Link>}
            />
          </div>
        </header>

        <div className="grid flex-1 gap-4 py-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="border-border/70 bg-card/85 h-fit rounded-3xl border p-3 shadow-sm backdrop-blur-md">
            <nav className="flex flex-col gap-1" aria-label="Admin navigation">
              <Button
                variant="secondary"
                className="justify-start rounded-2xl"
                render={<Link href={'/admin/skills' as Route<string>}>Skills and resources</Link>}
              />
              <Button variant="ghost" className="justify-start rounded-2xl" disabled>
                Templates
                <span className="text-muted-foreground ml-auto text-xs">Phase 2</span>
              </Button>
            </nav>
            <Separator className="my-3" />
            <p className="text-muted-foreground px-2 text-xs leading-5">
              Template graph editing is intentionally excluded from Phase 1.
            </p>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
