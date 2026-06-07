import type { Metadata } from 'next';

import { ProfileContent } from './_components/profile-content';

export const metadata: Metadata = {
  title: 'Profile Settings - RMap',
  description: 'Manage your RMap profile, avatar, GitHub link, and password.',
};

interface ProfilePageProps {
  searchParams: Promise<{
    tab?: string | string[];
  }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const params = await searchParams;
  const initialTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;

  return <ProfileContent initialTab={initialTab} />;
}
