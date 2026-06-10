'use client';

import type { Route } from 'next';

import { Book02Icon, ListTreeIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import { cn } from '@repo/design-system/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ADMIN_NAV_ITEMS = [
  {
    href: '/admin/skills',
    icon: Book02Icon,
    label: 'Skills and resources',
  },
  {
    href: '/admin/templates',
    icon: ListTreeIcon,
    label: 'Templates',
  },
] as const;

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="border-border/70 bg-background/75 shadow-primary/10 fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-xl rounded-3xl border p-2 shadow-lg backdrop-blur-xl"
      aria-label="Admin navigation"
    >
      <div className="flex gap-2">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Button
              key={item.href}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'h-11 flex-1 justify-center rounded-2xl px-3 text-xs sm:text-sm',
                isActive && 'pointer-events-none',
              )}
              render={
                <Link
                  href={item.href as Route<string>}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <HugeiconsIcon data-icon="inline-start" icon={item.icon} />
                  <span className="truncate">{item.label}</span>
                </Link>
              }
            />
          );
        })}
      </div>
    </nav>
  );
}
