'use client';

import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { Tabs } from '@repo/design-system/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useWatch } from 'react-hook-form';

import type { AuthUser } from '@/types/auth';

import { HeroGradient } from '@/components/shared/hero-gradient';
import { MaskBackground } from '@/components/shared/mask-background';
import { useAuth } from '@/hooks/use-auth';
import { buildDefaultAvatar } from '@/utils/user';

import { useAvatarPicker } from '../_hooks/use-avatar-picker';
import { usePasswordForm } from '../_hooks/use-password-form';
import { useProfileForm } from '../_hooks/use-profile-form';
import { IntegrationsTab } from './integrations-tab';
import { ProfileNavSidebar } from './profile-nav-sidebar';
import { ProfileSkeleton } from './profile-skeleton';
import { ProfileTab } from './profile-tab';
import { SecurityTab } from './security-tab';

type ProfileTabValue = 'integrations' | 'profile' | 'security';

function getDefaultProfileTab(value: null | string): ProfileTabValue {
  if (value === 'integrations' || value === 'security') {
    return value;
  }

  return 'profile';
}

interface ProfileContentProps {
  initialTab?: null | string;
}

export function ProfileContent({ initialTab = null }: ProfileContentProps) {
  const { user } = useAuth();
  const defaultTab = getDefaultProfileTab(initialTab);

  if (!user) {
    return <ProfileContentSkeleton />;
  }

  return <AuthenticatedProfileContent defaultTab={defaultTab} user={user} />;
}

function AuthenticatedProfileContent({
  defaultTab,
  user,
}: {
  defaultTab: ProfileTabValue;
  user: AuthUser;
}) {
  const router = useRouter();
  const { clearUser, refreshUser } = useAuth();

  const profileForm = useProfileForm({
    user,
    onSuccess: refreshUser,
    onSaved: () => {},
  });
  const formAvatarUrl = useWatch({
    control: profileForm.form.control,
    name: 'avatarUrl',
  });
  const avatarPicker = useAvatarPicker({
    setValue: profileForm.form.setValue,
    watch: profileForm.form.watch,
  });

  const passwordForm = usePasswordForm({
    onSuccess: () => {
      clearUser();
      router.push('/sign-in');
    },
  });

  const displayName = user.fullName ?? 'User';
  const currentAvatarUrl = formAvatarUrl || buildDefaultAvatar(displayName);

  return (
    <main className="flex flex-1 flex-col pt-28 pb-10 sm:pt-32">
      <HeroGradient />
      <MaskBackground />

      <section className="mx-auto flex w-full max-w-300 flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex max-w-3xl flex-col gap-2">
          <h1 className="text-heading text-3xl sm:text-4xl">Profile settings</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your public learning identity, connected account, and password.
          </p>
        </div>

        <Tabs
          className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start"
          orientation="vertical"
          defaultValue={defaultTab}
        >
          <ProfileNavSidebar
            displayName={displayName}
            email={user.email}
            avatarUrl={currentAvatarUrl}
          />

          <div className="min-w-0">
            <ProfileTab
              displayName={displayName}
              profileForm={profileForm}
              avatarPicker={avatarPicker}
            />
            <SecurityTab passwordForm={passwordForm} />
            <IntegrationsTab />
          </div>
        </Tabs>
      </section>
    </main>
  );
}

function ProfileContentSkeleton() {
  return (
    <main className="flex flex-1 flex-col pt-28 pb-10 sm:pt-32">
      <HeroGradient />
      <MaskBackground />
      <section className="mx-auto flex w-full max-w-300 flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex max-w-3xl flex-col gap-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <ProfileSkeleton />
      </section>
    </main>
  );
}
