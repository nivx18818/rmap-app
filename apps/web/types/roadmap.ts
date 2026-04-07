<<<<<<< HEAD
export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeData {
  label: string;
  style?: {
    fontSize?: number;
    justifyContent?: string;
    textAlign?: string;
    borderColor?: string;
    backgroundColor?: string;
    color?: string;
  };
  href?: string; // Dùng cho loại 'button' hoặc 'label'
  oldId?: string;
export type SkillNodeType = 'skill_node';
export type RoadmapNodeType = 'roadmap_node';
export type RoadmapBasedType = 'roadmap_based';
export type RelationType = 'optional' | 'required';

export type NodeType = SkillNodeType | RoadmapNodeType;

export interface SkillNode {
  id: string;
  name?: string;
  label: string;
  slug?: string;
  description?: string | null;
  category?: string | null;
  estimated_hours?: number | null;
  type: SkillNodeType;
}

export interface RoadmapNode {
  id: string;
  type: 'paragraph' | 'title' | 'topic' | 'vertical' | 'button' | 'label';
  position: NodePosition;
  data: NodeData;
  width?: number;
  height?: number;
  zIndex?: number;
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    strokeLinecap?: string;
  };
}

export interface RoadmapData {
  roadmap_id?: string;
  skill_id?: string;
  skill_name?: string;
  skill_estimated_hours?: number | null;
  parent_node_id?: string | null;
  relation_type?: RelationType;
  sort_order?: number;
  label: string;
  type: RoadmapNodeType;
  skills: SkillNode[];
  children?: RoadmapNode[];
}

export interface RoadmapData {
  id: string;
  user_id?: string | null;
  role_id?: string;
  role_name?: string;
  title: string;
  description?: string | null;
  is_template?: boolean;
  created_at?: string;
  type: RoadmapBasedType;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}
