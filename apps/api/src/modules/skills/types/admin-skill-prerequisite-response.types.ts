import type { SkillResponse } from './admin-skill-response.types';

export interface SkillPrerequisiteListResponse {
  prerequisites: SkillResponse[];
  skillId: string;
}
