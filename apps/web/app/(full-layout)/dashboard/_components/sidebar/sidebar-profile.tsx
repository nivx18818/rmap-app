import { Avatar, AvatarFallback, AvatarImage } from '@repo/design-system/components/ui/avatar';
import { Card, CardContent } from '@repo/design-system/components/ui/card';

import type { Dashboard } from '../../_types/dashboard.types';

import { getInitials } from '../../_utils/formatters';

interface SidebarProfileProps {
  userProfile: Dashboard['userProfile'];
}

export function SidebarProfile({ userProfile: profile }: SidebarProfileProps) {
  return (
    <Card className="rounded-lg py-4">
      <CardContent>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg" className="size-16! rounded-lg">
            <AvatarImage alt={profile.fullName} src={profile.avatarUrl} />
            <AvatarFallback className="rounded-lg">{getInitials(profile.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-heading truncate text-lg">{profile.fullName}</h2>
            <span className="text-muted-foreground truncate text-sm">{profile.email}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
