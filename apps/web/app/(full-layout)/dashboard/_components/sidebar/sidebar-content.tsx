import type {
  DailyActivityEntry,
  DashboardRoadmapStatus,
  DashboardSkillCategory,
  DashboardSummary,
  DashboardUserProfile,
} from '../../_types/dashboard.types';

import { SidebarLearningStats } from './sidebar-learning-stats';
import { SidebarProfile } from './sidebar-profile';
import { SidebarRecentActivity } from './sidebar-recent-activity';
import { SidebarRoadmapStatus } from './sidebar-roadmap-status';
import { SidebarSkillCategories } from './sidebar-skill-categories';

export interface DashboardSidebarContentProps {
  activityRecent: DailyActivityEntry[];
  profile: DashboardUserProfile;
  roadmapStatus: DashboardRoadmapStatus;
  skillCategories: DashboardSkillCategory[];
  summary: DashboardSummary;
}

export function SidebarContent({
  activityRecent,
  profile,
  roadmapStatus,
  skillCategories,
  summary,
}: DashboardSidebarContentProps) {
  return (
    <>
      <SidebarProfile profile={profile} />
      <SidebarLearningStats summary={summary} />
      <SidebarRecentActivity activityRecent={activityRecent} summary={summary} />
      <SidebarSkillCategories skillCategories={skillCategories} />
      <SidebarRoadmapStatus roadmapStatus={roadmapStatus} />
    </>
  );
}
