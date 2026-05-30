'use client';

import { ArrowRight02FreeIcons } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/design-system/components/ui/avatar';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@repo/design-system/components/ui/drawer';

import type { DashboardSidebarContentProps } from './sidebar/sidebar-content';

import { getInitials } from '../_utils/formatters';
import { SidebarContent } from './sidebar/sidebar-content';

export function DashboardSidebar(props: DashboardSidebarContentProps) {
  return (
    <>
      <aside className="hidden flex-col gap-3 xl:sticky xl:top-21 xl:flex xl:self-start">
        <SidebarContent {...props} />
      </aside>

      <div className="w-full xl:hidden">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" className="h-auto w-full justify-between py-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage alt={props.profile.fullName} src={props.profile.avatarUrl} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(props.profile.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-foreground text-sm font-semibold">
                    {props.profile.fullName}
                  </span>
                  <span className="text-muted-foreground text-xs">View Profile & Stats</span>
                </div>
              </div>
              <HugeiconsIcon className="text-muted-foreground" icon={ArrowRight02FreeIcons} />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="border-border/70 border-b text-left">
              <DrawerTitle>Profile & Stats</DrawerTitle>
              <DrawerDescription>Your learning overview and recent activity.</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-3">
                <SidebarContent {...props} />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
}
