import type { NodeProgress, NodeType, RoadmapNode } from './roadmap-node.types';

export type ResourceType = 'ARTICLE' | 'COURSE' | 'DOCS' | 'YOUTUBE';

export interface RoadmapNodeResource {
  id: number;
  isFree: boolean;
  isPrimary: boolean;
  resourceType: ResourceType;
  title: string;
  url: string;
}

export interface RoadmapNodePrerequisite {
  id: string;
  name: string;
}

export interface RoadmapNodeDetail {
  description: string | null;
  estimatedHours: number | null;
  id: string;
  name: string;
  nodeType: NodeType;
  prerequisites: RoadmapNodePrerequisite[];
  progress: NodeProgress | null;
  projectBrief?: string;
  resources: RoadmapNodeResource[];
  skillDescription?: string;
}

export interface RoadmapNodeDetailApiResponse {
  node: RoadmapNode;
  prerequisites: Array<{
    skillId: string;
    skillName: string;
  }>;
  resources: RoadmapNodeResource[] | null;
  skill: {
    defaultEstimatedHours: number | null;
    description: string | null;
    id: string;
    name: string;
    roleCategory: string | null;
  } | null;
}

export interface UpdateRoadmapNodeProgressResponse {
  progress: NodeProgress;
  unlockedNodes: string[];
}
