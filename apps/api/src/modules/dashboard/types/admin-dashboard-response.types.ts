export type AdminActivityType = 'resource' | 'skill' | 'template' | 'template_node';

export interface AdminDashboardTotals {
  resources: number;
  skills: number;
  templateNodes: number;
  templates: number;
}

export interface AdminDashboardActivityItem {
  id: string;
  label: string;
  timestamp: string;
  type: AdminActivityType;
}

export interface AdminDashboardResponse {
  recentActivity: AdminDashboardActivityItem[];
  totals: AdminDashboardTotals;
}
