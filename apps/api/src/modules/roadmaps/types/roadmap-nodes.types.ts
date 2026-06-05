import type {
  MilestoneSubmissionStatus,
  MilestoneTestSuiteStatus,
  NodeStatus,
  NodeType,
} from '@repo/db/prisma/client';

import type { RoadmapResponseDto } from '../dto/roadmap-response.dto';

export interface UserNodeProgressResponse {
  id: string;
  roadmapNodeId: string;
  status: NodeStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  quizScorePct: number | null;
  quizPassed: boolean | null;
}

export interface RoadmapNodeWithUserProgressResponse {
  id: string;
  roadmapId: string;
  parentId: string | null;
  skillId: string | null;
  name: string;
  description: string | null;
  nodeType: NodeType;
  estimatedHours: number | null;
  posX: number;
  posY: number;
  resourcesCount: number;
  progress: UserNodeProgressResponse | null;
}

export interface RoadmapNodesListResponse {
  nodes: RoadmapNodeWithUserProgressResponse[];
}

export interface SkillDetailResponse {
  id: string;
  name: string;
  description: string | null;
  defaultEstimatedHours: number | null;
  roleCategory: string | null;
}

export interface ResourceResponse {
  id: number;
  title: string;
  url: string;
  resourceType: string;
  isFree: boolean;
  isPrimary: boolean;
}

export interface PrerequisiteResponse {
  skillId: string;
  skillName: string;
}

export interface MilestoneSubmissionTestResultResponse {
  message: string;
  name: string;
  passed: boolean;
}

export interface MilestoneSubmissionResponse {
  id: string;
  repoUrl: string;
  testSuiteId: string | null;
  status: MilestoneSubmissionStatus;
  outputLog: string | null;
  passRatePct: number | null;
  passedTests: number | null;
  testResults: MilestoneSubmissionTestResultResponse[] | null;
  totalTests: number | null;
  attemptNumber: number;
  createdAt: string;
  completedAt: string | null;
}

export interface MilestoneSubmissionEnvelopeResponse {
  submission: MilestoneSubmissionResponse;
}

export interface LatestMilestoneSubmissionResponse {
  submission: MilestoneSubmissionResponse | null;
}

export interface MilestoneTestCaseResponse {
  description: string;
  name: string;
}

export interface MilestoneTestSuiteResponse {
  generatedAt: string | null;
  id: string;
  passThresholdPct: number;
  status: MilestoneTestSuiteStatus;
  summary: string;
  testCases: MilestoneTestCaseResponse[];
  title: string;
}

export interface NodeDetailResponse {
  node: RoadmapNodeWithUserProgressResponse;
  skill: SkillDetailResponse | null;
  resources: ResourceResponse[] | null;
  prerequisites: PrerequisiteResponse[];
  latestSubmission: MilestoneSubmissionResponse | null;
  milestoneTestSuite: MilestoneTestSuiteResponse | null;
}

export interface UpdateNodeProgressResponse {
  progress: UserNodeProgressResponse;
  unlockedNodes: string[];
}

export interface StartRoadmapResponse {
  roadmap: RoadmapResponseDto;
  unlockedNodes: string[];
}
