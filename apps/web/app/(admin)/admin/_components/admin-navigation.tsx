'use client';

import type { Route } from 'next';

import { Button } from '@repo/design-system/components/ui/button';
import { cn } from '@repo/design-system/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ADMIN_NAV_ITEMS = [
  {
    href: '/admin/skills',
    label: 'Skills and resources',
  },
  {
    href: '/admin/templates',
    label: 'Templates',
  },
] as const;

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Admin navigation">
      {ADMIN_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Button
            key={item.href}
            variant={isActive ? 'secondary' : 'ghost'}
            className={cn('justify-start rounded-2xl', isActive && 'pointer-events-none')}
            render={<Link href={item.href as Route<string>}>{item.label}</Link>}
          />
        );
      })}
    </nav>
  );
}
