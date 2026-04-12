export interface NavItem {
  label: string;
  href: string;
  /** If true, scrolls down by 1 screen height after navigating to the href */
  scrollAfterNav?: boolean;
}

export interface RoadmapItemData {
  label: string;
  href?: string;
  variant?: 'default' | 'create';
}

export interface RoadmapTimelineItem {
  title: string;
  iconType: 'map-pin' | 'circle' | 'dot';
  weight: 'semibold' | 'medium';
}
