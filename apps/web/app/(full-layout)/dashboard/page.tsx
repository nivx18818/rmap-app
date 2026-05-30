import type { Metadata } from 'next';

import { DashboardContent } from '@/app/(full-layout)/dashboard/_components/dashboard-content';

export const metadata: Metadata = {
  title: 'My Learning Dashboard - RMap',
  description: 'Track roadmap progress, streak activity, and skill readiness.',
};

export default function DashboardPage() {
  return <DashboardContent />;
}
