import type { NodeProgress, NodeType, RoadmapNode } from './roadmap-node.types';

export type ResourceType = 'ARTICLE' | 'COURSE' | 'DOCS' | 'YOUTUBE';
export type MilestoneSubmissionStatus = 'ERROR' | 'FAILED' | 'PASSED' | 'RUNNING';
export type MilestoneTestSuiteStatus = 'FAILED' | 'GENERATING' | 'NOT_GENERATED' | 'READY';

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

export interface MilestoneSubmissionTestResult {
  message: string;
  name: string;
  passed: boolean;
}

export interface MilestoneSubmission {
  id: string;
  repoUrl: string;
  testSuiteId: string | null;
  status: MilestoneSubmissionStatus;
  outputLog: string | null;
  passRatePct: number | null;
  passedTests: number | null;
  testResults: MilestoneSubmissionTestResult[] | null;
  totalTests: number | null;
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
}

export interface MilestoneTestCase {
  description: string;
  name: string;
}

export interface MilestoneTestSuite {
  generatedAt: string | null;
  id: string;
  passThresholdPct: number;
  status: MilestoneTestSuiteStatus;
  summary: string;
  testCases: MilestoneTestCase[];
  title: string;
}

export interface RoadmapNodeDetail {
  description: string | null;
  estimatedHours: number | null;
  id: string;
  name: string;
  nodeType: NodeType;
  latestSubmission: MilestoneSubmission | null;
  milestoneTestSuite: MilestoneTestSuite | null;
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
  milestoneTestSuite: MilestoneTestSuite | null;
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
