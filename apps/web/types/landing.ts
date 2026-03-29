export interface NavItem {
  label: string;
  href: string;
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
