import { MilestoneSubmissionStatus } from '@repo/db/prisma/client';

import type { MilestoneExecutionResult } from '@/modules/roadmaps/milestone-execution.client';

import { MilestoneSubmissionInvalidUrlException } from '@/common/exceptions/app.exceptions';

import type { MilestoneSubmissionTestResultResponse } from '../types/roadmap-nodes.types';
import type { MilestoneTestResult } from './roadmap-records';

import { roundToTwo } from './number';
import {
  MILESTONE_OUTPUT_LOG_LIMIT,
  MILESTONE_RESULT_MARKER,
  MILESTONE_TEST_RESULT_MESSAGE_LIMIT,
  MILESTONE_TEST_RESULT_NAME_LIMIT,
  MILESTONE_TEST_SUITE_CASE_COUNT,
} from './roadmap.constants';

const GITHUB_REPO_URL_PATTERN = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
const ESCAPE_CHARACTER = String.fromCharCode(27);
const ANSI_ESCAPE_PATTERN = new RegExp(
  `${ESCAPE_CHARACTER}(?:[@-Z\\\\-_]|\\[[0-?]*[ -/]*[@-~])`,
  'g',
);

export const assertMilestoneSubmissionPayload = (repoUrl: string): void => {
  if (!GITHUB_REPO_URL_PATTERN.test(repoUrl)) {
    throw new MilestoneSubmissionInvalidUrlException();
  }
};

export const toMilestoneTestResult = (
  executionResult: MilestoneExecutionResult,
): MilestoneTestResult | undefined => {
  if (
    executionResult.passRatePct === null ||
    executionResult.passedTests === null ||
    executionResult.testResults === null ||
    executionResult.totalTests === null
  ) {
    return undefined;
  }

  return {
    passRatePct: executionResult.passRatePct,
    passedTests: executionResult.passedTests,
    testResults: executionResult.testResults,
    totalTests: executionResult.totalTests,
  };
};

export const parseMilestoneTestResult = (output: string): MilestoneTestResult | null => {
  const markerIndex = output.lastIndexOf(MILESTONE_RESULT_MARKER);

  if (markerIndex === -1) {
    return null;
  }

  const markerPayload = output.slice(markerIndex + MILESTONE_RESULT_MARKER.length);
  const jsonLine = markerPayload.split(/\r?\n/, 1)[0]?.trim();

  if (!jsonLine) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonLine);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  const result = parsed as { passedTests?: unknown; tests?: unknown; totalTests?: unknown };
  const { passedTests, tests, totalTests } = result;

  if (
    typeof passedTests !== 'number' ||
    typeof totalTests !== 'number' ||
    !Number.isInteger(passedTests) ||
    !Number.isInteger(totalTests) ||
    totalTests !== MILESTONE_TEST_SUITE_CASE_COUNT ||
    passedTests < 0 ||
    passedTests > totalTests ||
    !Array.isArray(tests) ||
    tests.length !== MILESTONE_TEST_SUITE_CASE_COUNT
  ) {
    return null;
  }

  const testResults: MilestoneSubmissionTestResultResponse[] = [];

  for (const test of tests) {
    if (!test || typeof test !== 'object' || Array.isArray(test)) {
      return null;
    }

    const { message, name, passed } = test as Record<string, unknown>;

    if (typeof name !== 'string' || typeof passed !== 'boolean' || typeof message !== 'string') {
      return null;
    }

    const sanitizedName = sanitizeMilestoneTestResultText(name, MILESTONE_TEST_RESULT_NAME_LIMIT);
    const sanitizedMessage = sanitizeMilestoneTestResultText(
      message,
      MILESTONE_TEST_RESULT_MESSAGE_LIMIT,
    );

    if (sanitizedName.length === 0) {
      return null;
    }

    testResults.push({
      message: sanitizedMessage,
      name: sanitizedName,
      passed,
    });
  }

  if (passedTests !== testResults.filter((test) => test.passed).length) {
    return null;
  }

  return {
    passRatePct: roundToTwo((passedTests / totalTests) * 100),
    passedTests,
    testResults,
    totalTests,
  };
};

export const sanitizeMilestoneTestResultText = (value: string, limit: number): string => {
  const sanitized = value.replace(ANSI_ESCAPE_PATTERN, '').trim();

  if (sanitized.length <= limit) {
    return sanitized;
  }

  return `${sanitized.slice(0, limit - 3)}...`;
};

export const formatMilestoneTestResultSummary = (
  result: MilestoneTestResult,
  passThresholdPct: number,
): string =>
  `\n[result]\n${result.passedTests}/${result.totalTests} generated tests passed ` +
  `(${result.passRatePct}%). Threshold: ${passThresholdPct}%.\n`;

export const appendOutputLog = (currentLog: string, nextOutput: string): string =>
  sanitizeMilestoneOutputLog(`${currentLog}${nextOutput}`);

export const sanitizeMilestoneOutputLog = (outputLog: string): string => {
  const sanitized = outputLog.replace(ANSI_ESCAPE_PATTERN, '');

  if (sanitized.length <= MILESTONE_OUTPUT_LOG_LIMIT) {
    return sanitized;
  }

  return sanitized.slice(sanitized.length - MILESTONE_OUTPUT_LOG_LIMIT);
};

export const milestoneStatusFromPassRate = (
  result: MilestoneTestResult,
  passThresholdPct: number,
): MilestoneSubmissionStatus =>
  result.passRatePct >= passThresholdPct
    ? MilestoneSubmissionStatus.PASSED
    : MilestoneSubmissionStatus.FAILED;
