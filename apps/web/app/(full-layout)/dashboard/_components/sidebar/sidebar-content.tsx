import type {
  DailyActivityEntry,
  DashboardRoadmapStatus,
  DashboardSkillCategory,
  DashboardSummary,
} from '../../_types/dashboard.types';
import type { Dashboard } from '../../_types/dashboard.types';

import { SidebarLearningStats } from './sidebar-learning-stats';
import { SidebarProfile } from './sidebar-profile';
import { SidebarRecentActivity } from './sidebar-recent-activity';
import { SidebarRoadmapStatus } from './sidebar-roadmap-status';
import { SidebarSkillCategories } from './sidebar-skill-categories';

export interface DashboardSidebarContentProps {
  activityRecent: DailyActivityEntry[];
  userProfile: Dashboard['userProfile'];
  roadmapStatus: DashboardRoadmapStatus;
  skillCategories: DashboardSkillCategory[];
  summary: DashboardSummary;
}

export function SidebarContent({
  activityRecent,
  userProfile,
  roadmapStatus,
  skillCategories,
  summary,
}: DashboardSidebarContentProps) {
  return (
    <>
      <SidebarProfile userProfile={userProfile} />
      <SidebarLearningStats summary={summary} />
      <SidebarRecentActivity activityRecent={activityRecent} summary={summary} />
      <SidebarSkillCategories skillCategories={skillCategories} />
      <SidebarRoadmapStatus roadmapStatus={roadmapStatus} />
    </>
  );
}
