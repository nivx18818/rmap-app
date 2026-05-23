import type { NodeProgress, NodeType, RoadmapNode } from './roadmap-node.types';

export type ResourceType = 'ARTICLE' | 'COURSE' | 'DOCS' | 'YOUTUBE';
export type MilestoneSubmissionStatus = 'ERROR' | 'FAILED' | 'PASSED' | 'RUNNING';

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

export interface MilestoneSubmission {
  id: string;
  repoUrl: string;
  testCommand: string;
  status: MilestoneSubmissionStatus;
  outputLog: string | null;
  attemptNumber: number;
  createdAt: string;
  completedAt: string | null;
}

export interface MilestoneSubmissionResponse {
  submission: MilestoneSubmission;
}

export interface LatestMilestoneSubmissionResponse {
  submission: MilestoneSubmission | null;
}

export interface SubmitMilestoneSubmissionPayload {
  repoUrl: string;
  testCommand?: string;
}

export interface RoadmapNodeDetail {
  description: string | null;
  estimatedHours: number | null;
  id: string;
  name: string;
  nodeType: NodeType;
  latestSubmission: MilestoneSubmission | null;
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
  latestSubmission: MilestoneSubmission | null;
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
