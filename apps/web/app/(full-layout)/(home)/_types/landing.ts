export interface NavItem {
  label: string;
  href: string;
  /** If true, scrolls down by 1 screen height after navigating to the href */
  scrollAfterNav?: boolean;
}

export interface RoadmapItemData {
  id?: string;
  label: string;
  href?: string;
  variant?: 'default' | 'create';
  isComingSoon?: boolean;
}

export interface RoadmapTemplate {
  description: null | string;
  estimatedWeeks: null | number;
  id: string;
  roleCategory: string;
  title: string;
}

export interface RoadmapTemplateGroup {
  category: string;
  items: RoadmapItemData[];
  label: string;
}

export interface RoadmapTimelineItem {
  title: string;
  iconType: 'map-pin' | 'circle' | 'dot';
  weight: 'semibold' | 'medium';
}
