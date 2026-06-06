import type { Metadata } from 'next';

import { ProfileContent } from './_components/profile-content';

export const metadata: Metadata = {
  title: 'Profile Settings - RMap',
  description: 'Manage your RMap profile, avatar, GitHub link, and password.',
};

export default function ProfilePage() {
  return <ProfileContent />;
}
