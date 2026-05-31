import type { NavItem, RoadmapTimelineItem } from '@/app/(full-layout)/(home)/_types/landing';

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Generate personalized roadmap', href: '/roadmaps/generate' },
];

export const TIMELINE_ITEMS: RoadmapTimelineItem[] = [
  { title: 'Road to DevOps Engineer', iconType: 'map-pin', weight: 'semibold' },
  { title: 'Learn a Programming Language', iconType: 'circle', weight: 'medium' },
  { title: 'Operating System', iconType: 'circle', weight: 'medium' },
  { title: 'Terminal Knowledge', iconType: 'dot', weight: 'medium' },
  { title: 'Version Control Systems', iconType: 'dot', weight: 'medium' },
];
