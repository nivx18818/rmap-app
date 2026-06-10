import {
  ConnectIcon,
  Profile02Icon,
  SecurityIcon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/design-system/components/ui/avatar';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Separator } from '@repo/design-system/components/ui/separator';
import { TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';

import { getInitials } from '../_utils/formatters';

interface ProfileNavSidebarProps {
  avatarUrl: string;
  displayName: string;
  email: string;
}

export function ProfileNavSidebar({ avatarUrl, displayName, email }: ProfileNavSidebarProps) {
  return (
    <aside className="flex flex-col gap-4">
      <Card className="rounded-lg">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar size="lg" className="size-14! overflow-hidden rounded-lg">
              <AvatarImage
                className="h-full w-full object-contain"
                alt={displayName}
                src={avatarUrl}
              />
              <AvatarFallback className="rounded-lg">
                {getInitials(displayName) || <HugeiconsIcon icon={UserCircleIcon} />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="text-heading truncate text-base">{displayName}</h2>
              <p className="text-muted-foreground truncate text-sm">{email}</p>
            </div>
          </div>
          <Separator />
          <TabsList className="w-full flex-col items-stretch bg-transparent p-0">
            <TabsTrigger className="justify-start px-3 py-2" value="profile">
              <HugeiconsIcon className="size-4" icon={Profile02Icon} />
              Profile
            </TabsTrigger>
            <TabsTrigger className="justify-start px-3 py-2" value="security">
              <HugeiconsIcon className="size-4" icon={SecurityIcon} />
              Security
            </TabsTrigger>
            <TabsTrigger className="justify-start px-3 py-2" value="integrations">
              <HugeiconsIcon className="size-4" icon={ConnectIcon} />
              Integrations
            </TabsTrigger>
          </TabsList>
        </CardContent>
      </Card>
    </aside>
  );
}
