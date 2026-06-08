import type {
  MilestoneSubmissionStatus,
  MilestoneTestSuiteStatus,
  NodeStatus,
  NodeType,
} from '@repo/db/prisma/client';

import { type Prisma, type Roadmap } from '@repo/db/prisma/client';

import type { PrismaService } from '@/modules/prisma/prisma.service';

import type { ROADMAP_SELECT } from '../constants/roadmap.constants';
import type { MilestoneSubmissionTestResultResponse } from '../types/roadmap-nodes.types';

export type SelectedRoadmap = Pick<Roadmap, keyof typeof ROADMAP_SELECT>;

export type RoadmapTransaction = Awaited<
  Parameters<Parameters<PrismaService['$transaction']>[0]>[0]
>;

export type DecimalLike = {
  toNumber?: () => number;
  toString: () => string;
};

export type RoadmapNodeWithProgressRecord = {
  id: string;
  roadmapId: string;
  parentId: string | null;
  skillId: string | null;
  name: string;
  description: string | null;
  nodeType: NodeType;
  estimatedHours: Prisma.Decimal | number | null;
  posX: Prisma.Decimal | number;
  posY: Prisma.Decimal | number;
  skill?: {
    _count?: {
      resources: number;
    };
    resources?: unknown[];
  } | null;
  userNodeProgress: Array<{
    id: string;
    roadmapNodeId: string;
    status: NodeStatus;
    startedAt: Date | null;
    completedAt: Date | null;
    quizScorePct: Prisma.Decimal | number | null;
    quizPassed: boolean | null;
  }>;
};

export type RoadmapProgressNodeRecord = {
  id: string;
  nodeType: NodeType;
  estimatedHours: Prisma.Decimal | number | null;
  userNodeProgress: Array<{
    status: NodeStatus;
  }>;
};

export type DailyActivityRecord = {
  activityDate: Date;
  nodesCompleted: number;
};

export type MilestoneSubmissionRecord = {
  id: string;
  repoUrl: string;
  testSuiteId: string | null;
  status: MilestoneSubmissionStatus;
  outputLog: string | null;
  passRatePct: Prisma.Decimal | number | null;
  passedTests: number | null;
  testResults: Prisma.JsonValue | null;
  totalTests: number | null;
  attemptNumber: number;
  createdAt: Date;
  completedAt: Date | null;
};

export type MilestoneTestSuiteRecord = {
  id: string;
  roadmapNodeId: string;
  status: MilestoneTestSuiteStatus;
  title: string | null;
  summary: string | null;
  testCases: Prisma.JsonValue | null;
  testFileContent: string | null;
  passThresholdPct: number;
  generationStartedAt: Date | null;
  generatedAt: Date | null;
};

export type MilestoneTestSuiteInput = {
  id: string;
  name: string;
  projectBrief: string;
  roleCategory: null | string;
};

export type MilestoneTestResult = {
  passRatePct: number;
  passedTests: number;
  testResults: MilestoneSubmissionTestResultResponse[];
  totalTests: number;
};
