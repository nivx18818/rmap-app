import { MilestoneTestSuiteStatus, type Prisma } from '@repo/db/prisma/client';

import type { RoadmapResponseDto } from '../dto/roadmap-response.dto';
import type {
  MilestoneSubmissionResponse,
  MilestoneSubmissionTestResultResponse,
  RoadmapNodeWithUserProgressResponse,
} from '../types/roadmap-nodes.types';
import type {
  MilestoneSubmissionRecord,
  MilestoneTestSuiteRecord,
  RoadmapNodeWithProgressRecord,
  SelectedRoadmap,
} from './roadmap-records';

import { formatDateOnly } from './date';
import { formatDecimal, toNumberOrNull } from './number';
import { MILESTONE_TEST_SUITE_CASE_COUNT } from './roadmap.constants';

export const formatNodeWithProgress = (
  node: RoadmapNodeWithProgressRecord,
): RoadmapNodeWithUserProgressResponse => {
  const progress = node.userNodeProgress[0] ?? null;

  return {
    id: node.id,
    roadmapId: node.roadmapId,
    parentId: node.parentId,
    skillId: node.skillId,
    name: node.name,
    description: node.description,
    nodeType: node.nodeType,
    estimatedHours: toNumberOrNull(node.estimatedHours),
    posX: Number(node.posX),
    posY: Number(node.posY),
    progress: progress
      ? {
          id: progress.id,
          roadmapNodeId: progress.roadmapNodeId,
          status: progress.status,
          startedAt: progress.startedAt,
          completedAt: progress.completedAt,
          quizScorePct: toNumberOrNull(progress.quizScorePct),
          quizPassed: progress.quizPassed,
        }
      : null,
  };
};

export function formatMilestoneSubmission(
  submission: MilestoneSubmissionRecord,
): MilestoneSubmissionResponse;
export function formatMilestoneSubmission(submission: null): null;
export function formatMilestoneSubmission(
  submission: MilestoneSubmissionRecord | null,
): MilestoneSubmissionResponse | null;
export function formatMilestoneSubmission(
  submission: MilestoneSubmissionRecord | null,
): MilestoneSubmissionResponse | null {
  if (!submission) {
    return null;
  }

  return {
    id: submission.id,
    repoUrl: submission.repoUrl,
    testSuiteId: submission.testSuiteId,
    status: submission.status,
    outputLog: submission.outputLog,
    passRatePct: toNumberOrNull(submission.passRatePct),
    passedTests: submission.passedTests,
    testResults: parseStoredMilestoneTestResults(submission.testResults),
    totalTests: submission.totalTests,
    attemptNumber: submission.attemptNumber,
    createdAt: submission.createdAt.toISOString(),
    completedAt: submission.completedAt?.toISOString() ?? null,
  };
}

export const parseStoredMilestoneTestResults = (
  value: Prisma.JsonValue | null,
): MilestoneSubmissionTestResultResponse[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const testResults: MilestoneSubmissionTestResultResponse[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return null;
    }

    const { message, name, passed } = item as Record<string, unknown>;

    if (typeof name !== 'string' || typeof passed !== 'boolean' || typeof message !== 'string') {
      return null;
    }

    testResults.push({ message, name, passed });
  }

  return testResults;
};

export const formatMilestoneTestSuite = (suite: MilestoneTestSuiteRecord | null) => {
  if (!suite || suite.status !== MilestoneTestSuiteStatus.READY) {
    return null;
  }

  const testCases = parseStoredMilestoneTestCases(suite.testCases);

  if (
    !suite.title ||
    !suite.summary ||
    !suite.testFileContent ||
    testCases.length !== MILESTONE_TEST_SUITE_CASE_COUNT
  ) {
    return null;
  }

  return {
    id: suite.id,
    status: suite.status,
    title: suite.title,
    summary: suite.summary,
    testCases,
    passThresholdPct: suite.passThresholdPct,
    generatedAt: suite.generatedAt?.toISOString() ?? null,
  };
};

export const parseStoredMilestoneTestCases = (testCases: Prisma.JsonValue | null) => {
  if (!Array.isArray(testCases)) {
    return [];
  }

  return testCases
    .filter((testCase): testCase is { description: string; name: string } => {
      if (!testCase || typeof testCase !== 'object' || Array.isArray(testCase)) {
        return false;
      }

      const candidate = testCase as { description?: unknown; name?: unknown };

      return (
        typeof candidate.name === 'string' &&
        typeof candidate.description === 'string' &&
        candidate.name.trim().length > 0 &&
        candidate.description.trim().length > 0
      );
    })
    .map((testCase) => ({
      description: testCase.description,
      name: testCase.name,
    }));
};

export const formatRoadmap = (
  roadmap: SelectedRoadmap,
  startedAt: Date | null = null,
): RoadmapResponseDto => ({
  deadlineDate: formatDateOnly(roadmap.deadlineDate),
  description: roadmap.description,
  estimatedWeeks: roadmap.estimatedWeeks,
  generatedAt: roadmap.generatedAt.toISOString(),
  goalName: roadmap.goalName,
  hoursPerDay: formatDecimal(roadmap.hoursPerDay),
  id: roadmap.id,
  isTemplate: roadmap.isTemplate,
  roleCategory: roadmap.roleCategory,
  startedAt: startedAt?.toISOString() ?? null,
  title: roadmap.title,
  updatedAt: roadmap.updatedAt.toISOString(),
  userId: roadmap.userId,
});
