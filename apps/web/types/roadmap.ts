export type UserRole = 'user' | 'admin';
export type SkillLevel = 'fresher' | 'junior' | 'middle';
export type NodeStatus = 'locked' | 'in_progress' | 'completed';
export type ResourcePlatform = 'udemy' | 'coursera' | 'youtube' | 'other';
export type SkillProficiency = 'none' | 'basic' | 'intermediate';
export type RelationType = 'optional' | 'required';

export type UUID = string;
export type Timestamp = string;

export interface SkillNode {
  category?: string | null;
  description?: string | null;
  estimated_hours?: number | null;
  id: UUID;
  label: string;
  name?: string;
  slug?: string;
  type: 'skill_node';
}

export interface NormalizedRoadmapNode {
  children: NormalizedRoadmapNode[];
  id: UUID;
  parent_node_id: UUID | null;
  relation_type: RelationType;
  roadmap_id: UUID;
  skill_estimated_hours: number | null;
  skill_id: UUID;
  skill_name: string;
  sort_order: number;
}

export interface RoadmapGraphSkill {
  estimated_hours?: number | null;
  id: UUID;
  label: string;
  roadmap_node_id: UUID;
  relation_type: RelationType;
  status: NodeStatus;
}

export interface RoadmapGraphNode {
  id: UUID;
  label: string;
  parent_node_id: UUID | null;
  relation_type: RelationType;
  roadmap_id: UUID;
  skill_estimated_hours: number | null;
  skill_id: UUID;
  skill_name: string;
  skills: RoadmapGraphSkill[];
  sort_order: number;
  status: NodeStatus;
  type: 'roadmap_graph_node';
}

export interface ApiRoadmapNode {
  children: ApiRoadmapNode[] | string[];
  id: UUID;
  parent_node_id: UUID | null;
  relation_type: RelationType;
  roadmap_id: UUID;
  skill_estimated_hours: number | null;
  skill_id: UUID;
  skill_name: string;
  sort_order: number;
}

export interface RoadmapWithNodes {
  created_at: Timestamp;
  description: string | null;
  id: UUID;
  is_template: boolean;
  nodes: NormalizedRoadmapNode[];
  role_id: UUID;
  role_name: string;
  title: string;
  type: 'roadmap_based';
  user_id: UUID | null;
}

export interface ApiRoadmapResponse {
  created_at: Timestamp;
  description: string | null;
  id: UUID;
  is_template: boolean;
  nodes: ApiRoadmapNode[];
  role_id: UUID;
  role_name: string;
  title: string;
  user_id: UUID | null;
}

export interface NodeProgress {
  completed_at: Timestamp | null;
  roadmap_node_id: UUID;
  skill_id: UUID;
  skill_name: string;
  started_at: Timestamp | null;
  status: NodeStatus;
}

export interface RoadmapProgress {
  completed_nodes: number;
  completion_percentage: number;
  in_progress_nodes: number;
  nodes: NodeProgress[];
  roadmap_id: UUID;
  total_nodes: number;
}

export interface Resource {
  id: UUID;
  is_free: boolean;
  level_tag: SkillLevel | null;
  platform: ResourcePlatform;
  skill_id: UUID;
  title: string;
  url: string;
}
