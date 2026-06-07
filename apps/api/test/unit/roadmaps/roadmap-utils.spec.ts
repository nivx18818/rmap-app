import { NodeStatus } from '@repo/db/prisma/client';

import { QuizNodeNotInProgressException } from '@/common/exceptions/app.exceptions';
import { stripMarkdownFences } from '@/modules/roadmaps/utils/markdown';
import {
  parseMilestoneTestResult,
  sanitizeMilestoneOutputLog,
} from '@/modules/roadmaps/utils/milestone-output';
import { formatDecimal, roundToTwo } from '@/modules/roadmaps/utils/number';
import { assertQuizNodeInProgress, pickRandomQuizQuestions } from '@/modules/roadmaps/utils/quiz';
import {
  calculateDeadlineTimelineWarning,
  calculateEstimatedWeeks,
  calculatePercent,
} from '@/modules/roadmaps/utils/timeline';

const makeMilestonePayload = (passedTests = 6) => ({
  totalTests: 6,
  passedTests,
  tests: Array.from({ length: 6 }, (_, index) => ({
    name: `case ${index + 1}`,
    passed: index < passedTests,
    message: index < passedTests ? 'ok' : 'failed',
  })),
});

describe('roadmaps utils helpers', () => {
  describe('markdown helpers', () => {
    it('should strip fenced JSON responses', () => {
      expect(stripMarkdownFences('```json\n{"ok":true}\n```')).toBe('{"ok":true}');
    });
  });

  describe('number helpers', () => {
    it('should format decimal-like values and round to two places', () => {
      expect(formatDecimal({ toNumber: () => 2.5, toString: () => '2.5' })).toBe(2.5);
      expect(roundToTwo(83.333)).toBe(83.33);
    });
  });

  describe('timeline helpers', () => {
    it('should calculate percentages and estimated weeks', () => {
      expect(calculatePercent(3, 5)).toBe(60);
      expect(calculateEstimatedWeeks(21, 3)).toBe(1);
    });

    it('should return a warning when generated hours do not fit the deadline', () => {
      expect(
        calculateDeadlineTimelineWarning(
          new Date('2026-01-08T00:00:00Z'),
          1,
          20,
          new Date('2026-01-01T00:00:00Z'),
        ),
      ).toEqual(
        expect.objectContaining({
          isBehind: true,
          estimatedDelayDays: 13,
        }),
      );
    });
  });

  describe('quiz helpers', () => {
    it('should reject quiz access unless a node is in progress', () => {
      expect(() => assertQuizNodeInProgress(NodeStatus.LOCKED)).toThrow(
        QuizNodeNotInProgressException,
      );
    });

    it('should cap random quiz picks to five questions', () => {
      expect(pickRandomQuizQuestions([1, 2, 3, 4, 5, 6, 7, 8])).toHaveLength(5);
    });
  });

  describe('milestone output helpers', () => {
    it('should parse valid generated milestone output markers', () => {
      expect(
        parseMilestoneTestResult(
          `noise\nRMAP_MILESTONE_RESULTS:${JSON.stringify(makeMilestonePayload(5))}\n`,
        ),
      ).toEqual(
        expect.objectContaining({
          passRatePct: 83.33,
          passedTests: 5,
          totalTests: 6,
        }),
      );
    });

    it('should remove ANSI escapes and retain the newest output slice', () => {
      expect(sanitizeMilestoneOutputLog('\u001B[31mfailed\u001B[0m')).toBe('failed');
    });
  });
});
