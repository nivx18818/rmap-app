'use client';

import { GithubIcon, MapsIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button } from '@repo/design-system/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@repo/design-system/components/ui/navigation-menu';
import Link from 'next/link';

import { NAV_ITEMS } from '@/lib/data/landing';

export function Header() {
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
              <NavigationMenuLink render={<Link href="/">{item.label}</Link>} />
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
              href="https://github.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              <HugeiconsIcon className="size-4" icon={GithubIcon} />
              Star us
            </Link>
          }
        />
        <Button variant="outline" size="sm" render={<Link href="/">Login</Link>} />
        <Button
          size="sm"
          className="rounded-l-md rounded-r-full"
          render={<Link href="/">Get Started</Link>}
        />
      </div>
    </header>
  );
}
