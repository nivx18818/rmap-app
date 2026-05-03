export interface GenerateRoadmapInput {
  goal: string;
  roleCategory: string;
  hoursPerDay: number;
  deadlineDate: string;
  quizAnswers: Array<{ question: string; answer: string }>;
  skillMap: Array<{ id: string; name: string; defaultEstimatedHours: number | null }>;
  prerequisites: Array<{
    skillId: string;
    skillName: string;
    prerequisiteSkillId: string;
    prerequisiteSkillName: string;
  }>;
}

/**
 * Types representing the structured output from the AI roadmap generation prompt.
 * These are NOT stored in the DB — they are parsed from Gemini's JSON response
 * and immediately transformed into FlatNode[] for layout + persistence.
 */
export interface AiNode {
  name: string;
  /** Top-level nodes are 'group' or 'milestone'. Children are 'required' or 'optional'. */
  nodeType: 'group' | 'milestone' | 'required' | 'optional';
  /** Milestone nodes only — capstone project brief. */
  description?: string;
  /** Leaf nodes only — hours to complete this skill. */
  estimatedHours?: number;
  /** Required/optional leaf nodes only. Group/milestone nodes must not have a skillId. */
  skillId?: string | null;
  /** Group nodes only — max 2 levels deep (Parent Group -> Sub Group -> Leaf). */
  children?: AiNode[];
}

export interface AiRoadmapOutput {
  title: string;
  description: string;
  /** Top-level: 'group' | 'milestone' nodes only. */
  nodes: AiNode[];
}

/**
 * Intermediate flat representation used for Dagre layout computation
 * and Prisma bulk insert. Built from AiRoadmapOutput before any DB writes.
 */
export interface FlatNode {
  /** Temporary string ID assigned before layout (e.g. 't0', 't1'). */
  tempId: string;
  tempParentId: string | null;
  /** Pre-generated UUID for the DB row. */
  realId: string;
  /** Resolved after all realIds are generated. */
  realParentId: string | null;
  name: string;
  nodeType: 'GROUP' | 'MILESTONE' | 'REQUIRED' | 'OPTIONAL';
  description: string | null;
  estimatedHours: number | null;
  /** Required/optional leaf nodes only; null for group and milestone nodes. */
  skillId: string | null;
}
