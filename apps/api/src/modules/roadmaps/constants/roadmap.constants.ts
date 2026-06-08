import { NodeStatus, NodeType, ResourceType, type Prisma } from '@repo/db/prisma/client';

/** Number of milliseconds in a day. */
export const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Timeline warning threshold: warn when total > available * (1 + THRESHOLD). */
export const FEASIBILITY_THRESHOLD = 0.15;

export const PACE_WARNING_THRESHOLD_PCT = 15;
export const LEAF_NODE_TYPES: NodeType[] = [NodeType.REQUIRED, NodeType.OPTIONAL];
export const NODE_QUIZ_QUESTION_COUNT = 5;
export const NODE_QUIZ_BANK_QUESTION_COUNT = 8;
export const QUIZ_GENERATION_POLL_TIMEOUT_MS = 45_000;
export const QUIZ_GENERATION_POLL_INTERVAL_MS = 1_500;
export const QUIZ_PASSING_SCORE_PCT = 60;
export const QUIZ_REVIEW_SUGGESTION = 'You should review this part before continuing.';
export const NODE_DETAIL_RESOURCE_LIMIT = 5;
export const MILESTONE_PASS_THRESHOLD_PCT = 80;
export const MILESTONE_TEST_SUITE_CASE_COUNT = 6;
export const MILESTONE_TEST_SUITE_POLL_TIMEOUT_MS = 45_000;
export const MILESTONE_TEST_SUITE_POLL_INTERVAL_MS = 1_500;
export const MILESTONE_TEST_FILE_DIRECTORY = '.rmap';
export const MILESTONE_TEST_FILE_NAME = 'milestone-test.mjs';
export const MILESTONE_TEST_FILE_RELATIVE_PATH = `${MILESTONE_TEST_FILE_DIRECTORY}/${MILESTONE_TEST_FILE_NAME}`;
export const MILESTONE_GENERATED_TEST_COMMAND = `node ${MILESTONE_TEST_FILE_RELATIVE_PATH}`;
export const MILESTONE_RESULT_MARKER = 'RMAP_MILESTONE_RESULTS:';
export const MILESTONE_TEST_RESULT_NAME_LIMIT = 200;
export const MILESTONE_TEST_RESULT_MESSAGE_LIMIT = 1_000;
export const MILESTONE_EXECUTION_TIMEOUT_MS = 120_000;
export const MILESTONE_OUTPUT_LOG_LIMIT = 20_000;

export const RESOURCE_TYPE_PRIORITY = {
  [ResourceType.YOUTUBE]: 0,
  [ResourceType.DOCS]: 1,
  [ResourceType.COURSE]: 2,
  [ResourceType.ARTICLE]: 3,
} satisfies Record<ResourceType, number>;

export const VALID_TRANSITIONS: Record<NodeStatus, NodeStatus[]> = {
  [NodeStatus.LOCKED]: [],
  [NodeStatus.IN_PROGRESS]: [NodeStatus.COMPLETED],
  [NodeStatus.COMPLETED]: [],
};

export const ROADMAP_SELECT = {
  deadlineDate: true,
  description: true,
  estimatedWeeks: true,
  generatedAt: true,
  goalName: true,
  hoursPerDay: true,
  id: true,
  isTemplate: true,
  roleCategory: true,
  title: true,
  updatedAt: true,
  userId: true,
} satisfies Prisma.RoadmapSelect;

export const MILESTONE_SUBMISSION_SELECT = {
  id: true,
  repoUrl: true,
  testSuiteId: true,
  status: true,
  outputLog: true,
  passRatePct: true,
  passedTests: true,
  testResults: true,
  totalTests: true,
  attemptNumber: true,
  createdAt: true,
  completedAt: true,
} satisfies Prisma.MilestoneSubmissionSelect;

export const MILESTONE_TEST_SUITE_SELECT = {
  id: true,
  roadmapNodeId: true,
  status: true,
  title: true,
  summary: true,
  testCases: true,
  testFileContent: true,
  passThresholdPct: true,
  generationStartedAt: true,
  generatedAt: true,
} satisfies Prisma.MilestoneTestSuiteSelect;
