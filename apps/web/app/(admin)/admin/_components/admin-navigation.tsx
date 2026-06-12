'use client';

import type { Route } from 'next';
import type { ComponentProps } from 'react';

import {
  Book02Icon,
  DashboardBrowsingIcon,
  ListTreeIcon,
  MapsIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@repo/design-system/components/ui/badge';
import { cn } from '@repo/design-system/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminNavItem {
  href: '/admin' | '/admin/skills' | '/admin/templates';
  icon: ComponentProps<typeof HugeiconsIcon>['icon'];
  label: string;
}

interface AdminNavGroup {
  items: AdminNavItem[];
  label: string;
}

const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    items: [
      {
        href: '/admin',
        icon: DashboardBrowsingIcon,
        label: 'Overview',
      },
    ],
    label: 'Workspace',
  },
  {
    items: [
      {
        href: '/admin/skills',
        icon: Book02Icon,
        label: 'Skills and resources',
      },
      {
        href: '/admin/templates',
        icon: ListTreeIcon,
        label: 'Template roadmaps',
      },
    ],
    label: 'Content management',
  },
];

const MOBILE_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap((group) => group.items);

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <>
      <aside className="border-border/70 bg-sidebar/90 hidden w-64 shrink-0 border-r backdrop-blur-xl lg:fixed lg:inset-y-0 lg:flex lg:flex-col">
        <div className="border-border/70 flex h-18 items-center gap-3 border-b px-6">
          <HugeiconsIcon className="size-7" icon={MapsIcon} />
          <div className="min-w-0">
            <Link className="font-heading text-xl font-bold" href={'/' as Route<string>}>
              RMap
            </Link>
            <p className="text-muted-foreground text-xs">Admin Console</p>
          </div>
        </div>

        <nav className="scrollbar-thin flex flex-1 flex-col gap-7 overflow-y-auto px-4 py-6">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="text-muted-foreground px-3 text-xs font-medium tracking-[0.18em] uppercase">
                {group.label}
              </p>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <AdminNavLink key={item.href} item={item} pathname={pathname} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-border/70 p-4">
          <div className="bg-muted/40 flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Content ops</p>
              <Badge variant="secondary">MVP</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Manage skills, resources, and templates from the same admin workspace.
            </p>
          </div>
        </div>
      </aside>

      <nav
        className="border-border/70 bg-background/90 fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] mx-auto max-w-xl rounded-lg border p-1 shadow-lg backdrop-blur-xl lg:hidden"
        aria-label="Admin mobile navigation"
      >
        <div className="grid grid-cols-3 gap-1">
          {MOBILE_NAV_ITEMS.map((item) => {
            const isActive = isAdminRouteActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                className={cn(
                  'text-muted-foreground focus-visible:ring-ring/50 flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none',
                  isActive && 'bg-primary text-primary-foreground',
                )}
                href={item.href as Route<string>}
                aria-current={isActive ? 'page' : undefined}
              >
                <HugeiconsIcon icon={item.icon} />
                <span className="max-w-full truncate">{getMobileLabel(item.label)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <nav className="text-muted-foreground text-sm" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1">
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={`${breadcrumb.href}-${breadcrumb.label}`} className="flex items-center gap-1">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {isLast ? (
                <span className="text-foreground font-medium">{breadcrumb.label}</span>
              ) : (
                <Link
                  className="hover:text-foreground transition-colors"
                  href={breadcrumb.href as Route<string>}
                >
                  {breadcrumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function AdminNavLink({ item, pathname }: { item: AdminNavItem; pathname: string }) {
  const isActive = isAdminRouteActive(pathname, item.href);

  return (
    <Link
      className={cn(
        'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring/50 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none',
        isActive &&
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
      )}
      href={item.href as Route<string>}
      aria-current={isActive ? 'page' : undefined}
    >
      <HugeiconsIcon icon={item.icon} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function getBreadcrumbs(pathname: string): Array<{ href: string; label: string }> {
  if (pathname.startsWith('/admin/templates/') && pathname !== '/admin/templates') {
    return [
      { href: '/admin', label: 'Admin' },
      { href: '/admin/templates', label: 'Templates' },
      { href: pathname, label: 'Template nodes' },
    ];
  }

  if (pathname.startsWith('/admin/templates')) {
    return [
      { href: '/admin', label: 'Admin' },
      { href: '/admin/templates', label: 'Templates' },
    ];
  }

  if (pathname.startsWith('/admin/skills')) {
    return [
      { href: '/admin', label: 'Admin' },
      { href: '/admin/skills', label: 'Skills' },
    ];
  }

  return [{ href: '/admin', label: 'Admin' }];
}

function getMobileLabel(label: string): string {
  if (label === 'Skills and resources') {
    return 'Skills';
  }

  if (label === 'Template roadmaps') {
    return 'Templates';
  }

  return label;
}

function isAdminRouteActive(pathname: string, href: string): boolean {
  if (href === '/admin') {
    return pathname === '/admin';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
