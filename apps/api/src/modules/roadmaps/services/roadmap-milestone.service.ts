import { Injectable, Logger } from '@nestjs/common';
import {
  MilestoneSubmissionStatus,
  MilestoneTestSuiteStatus,
  NodeStatus,
  NodeType,
  type Prisma,
} from '@repo/db/prisma/client';

import {
  AppConflictException,
  InvalidStatusTransitionException,
  MilestoneSubmissionInProgressException,
  MilestoneSubmissionInvalidStateException,
  MilestoneTestSuiteGenerationUnavailableException,
  RoadmapNodeNotFoundException,
  UserNodeProgressNotFoundException,
} from '@/common/exceptions/app.exceptions';
import { AiService, type GeneratedMilestoneTestSuite } from '@/modules/ai/ai.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { SubmitMilestoneSubmissionDto } from '../dto/submit-milestone-submission.dto';
import type {
  LatestMilestoneSubmissionResponse,
  MilestoneSubmissionEnvelopeResponse,
} from '../types/roadmap-nodes.types';
import type {
  MilestoneTestResult,
  MilestoneTestSuiteInput,
  MilestoneTestSuiteRecord,
} from '../utils/roadmap-records';

import {
  MILESTONE_EXECUTION_TIMEOUT_MS,
  MILESTONE_GENERATED_TEST_COMMAND,
  MILESTONE_PASS_THRESHOLD_PCT,
  MILESTONE_RESULT_MARKER,
  MILESTONE_SUBMISSION_SELECT,
  MILESTONE_TEST_SUITE_CASE_COUNT,
  MILESTONE_TEST_SUITE_POLL_INTERVAL_MS,
  MILESTONE_TEST_SUITE_POLL_TIMEOUT_MS,
  MILESTONE_TEST_SUITE_SELECT,
} from '../constants/roadmap.constants';
import { MilestoneExecutionClient } from '../milestone-execution.client';
import { delay } from '../utils/async';
import {
  assertMilestoneSubmissionPayload,
  sanitizeMilestoneOutputLog,
  toMilestoneTestResult,
} from '../utils/milestone-output';
import { getRoadmapRelationAccessWhere } from '../utils/roadmap-access';
import { formatMilestoneSubmission, formatMilestoneTestSuite } from '../utils/roadmap-formatters';
import { acquireUserRoadmapLock } from '../utils/roadmap-lock';
import { RoadmapProgressService } from './roadmap-progress.service';

@Injectable()
export class RoadmapMilestoneService {
  private readonly logger = new Logger(RoadmapMilestoneService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly milestoneExecutionClient: MilestoneExecutionClient,
    private readonly roadmapProgress: RoadmapProgressService,
  ) {}

  async submitMilestoneSubmission(
    userId: string,
    roadmapId: string,
    nodeId: string,
    dto: SubmitMilestoneSubmissionDto,
  ): Promise<MilestoneSubmissionEnvelopeResponse> {
    const repoUrl = dto.repoUrl.trim();

    assertMilestoneSubmissionPayload(repoUrl);

    const node = await this.prisma.roadmapNode.findFirst({
      where: {
        id: nodeId,
        roadmapId,
        roadmap: getRoadmapRelationAccessWhere(userId),
      },
      select: {
        id: true,
        description: true,
        name: true,
        nodeType: true,
        roadmap: {
          select: {
            roleCategory: true,
          },
        },
        milestoneTestSuite: {
          select: MILESTONE_TEST_SUITE_SELECT,
        },
        userNodeProgress: {
          where: { userId },
          select: { startedAt: true, status: true },
          take: 1,
        },
      },
    });

    if (!node) {
      throw new RoadmapNodeNotFoundException(nodeId);
    }

    if (node.nodeType !== NodeType.MILESTONE) {
      throw new MilestoneSubmissionInvalidStateException(
        'Only milestone nodes can receive project submissions',
      );
    }

    const currentProgress = node.userNodeProgress[0];
    const currentStatus = currentProgress?.status ?? NodeStatus.LOCKED;

    if (currentStatus === NodeStatus.LOCKED) {
      throw new InvalidStatusTransitionException(currentStatus, NodeStatus.IN_PROGRESS);
    }

    if (currentStatus === NodeStatus.COMPLETED) {
      throw new MilestoneSubmissionInvalidStateException(
        'Completed milestones cannot receive new submissions',
      );
    }

    const currentCycleStartedAt = currentProgress?.startedAt;
    if (!currentCycleStartedAt) {
      throw new AppConflictException('Milestone learning progress is not active');
    }

    const testSuite = await this.resolveMilestoneTestSuiteForNodeDetail({
      existingSuite: node.milestoneTestSuite,
      nodeId: node.id,
      nodeName: node.name,
      projectBrief: node.description ?? node.name,
      roleCategory: node.roadmap.roleCategory,
      status: currentStatus,
    });

    if (!testSuite) {
      throw new MilestoneTestSuiteGenerationUnavailableException();
    }

    const submission = await this.prisma.$transaction(async (tx) => {
      await acquireUserRoadmapLock(tx, userId, roadmapId);

      const latestProgress = await tx.userNodeProgress.findUnique({
        where: {
          userId_roadmapNodeId: {
            roadmapNodeId: node.id,
            userId,
          },
        },
        select: { startedAt: true, status: true },
      });

      if (!latestProgress) {
        throw new UserNodeProgressNotFoundException(node.id);
      }

      if (latestProgress.startedAt?.getTime() !== currentCycleStartedAt.getTime()) {
        throw new AppConflictException('Learning progress changed before submission could start');
      }

      if (latestProgress.status === NodeStatus.LOCKED) {
        throw new InvalidStatusTransitionException(latestProgress.status, NodeStatus.IN_PROGRESS);
      }

      if (latestProgress.status === NodeStatus.COMPLETED) {
        throw new MilestoneSubmissionInvalidStateException(
          'Completed milestones cannot receive new submissions',
        );
      }

      const runningSubmission = await tx.milestoneSubmission.findFirst({
        where: {
          roadmapNodeId: node.id,
          status: MilestoneSubmissionStatus.RUNNING,
          userId,
        },
        select: { id: true },
      });

      if (runningSubmission) {
        throw new MilestoneSubmissionInProgressException();
      }

      const latestSubmission = await tx.milestoneSubmission.findFirst({
        where: {
          roadmapNodeId: node.id,
          userId,
        },
        orderBy: [{ attemptNumber: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        select: { attemptNumber: true },
      });

      return tx.milestoneSubmission.create({
        data: {
          attemptNumber: (latestSubmission?.attemptNumber ?? 0) + 1,
          repoUrl,
          roadmapNodeId: node.id,
          status: MilestoneSubmissionStatus.RUNNING,
          testCommand: MILESTONE_GENERATED_TEST_COMMAND,
          testSuiteId: testSuite.id,
          userId,
        },
        select: MILESTONE_SUBMISSION_SELECT,
      });
    });

    this.queueMilestoneSubmissionExecution(submission.id);

    return { submission: formatMilestoneSubmission(submission) };
  }

  async getLatestMilestoneSubmission(
    userId: string,
    roadmapId: string,
    nodeId: string,
  ): Promise<LatestMilestoneSubmissionResponse> {
    const node = await this.prisma.roadmapNode.findFirst({
      where: {
        id: nodeId,
        roadmapId,
        roadmap: getRoadmapRelationAccessWhere(userId),
      },
      select: {
        id: true,
        nodeType: true,
        userNodeProgress: {
          where: { userId },
          select: { startedAt: true },
          take: 1,
        },
      },
    });

    if (!node) {
      throw new RoadmapNodeNotFoundException(nodeId);
    }

    if (node.nodeType !== NodeType.MILESTONE) {
      throw new MilestoneSubmissionInvalidStateException(
        'Only milestone nodes have project submissions',
      );
    }

    const progressStartedAt = node.userNodeProgress[0]?.startedAt;
    if (!progressStartedAt) {
      return { submission: null };
    }

    const submission = await this.prisma.milestoneSubmission.findFirst({
      where: {
        createdAt: { gte: progressStartedAt },
        roadmapNodeId: node.id,
        userId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: MILESTONE_SUBMISSION_SELECT,
    });

    return { submission: formatMilestoneSubmission(submission) };
  }

  async resolveMilestoneTestSuiteForNodeDetail(input: {
    existingSuite: MilestoneTestSuiteRecord | null;
    nodeId: string;
    nodeName: string;
    projectBrief: string;
    roleCategory: null | string;
    status: NodeStatus;
  }) {
    const formattedExistingSuite = formatMilestoneTestSuite(input.existingSuite);

    if (formattedExistingSuite) {
      return formattedExistingSuite;
    }

    if (input.status === NodeStatus.LOCKED) {
      return null;
    }

    const suite = await this.generateOrWaitForMilestoneTestSuite({
      id: input.nodeId,
      name: input.nodeName,
      projectBrief: input.projectBrief,
      roleCategory: input.roleCategory,
    });

    return formatMilestoneTestSuite(suite);
  }

  async executeMilestoneSubmission(submissionId: string): Promise<void> {
    const submission = await this.prisma.milestoneSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        repoUrl: true,
        roadmapNodeId: true,
        testSuite: {
          select: {
            id: true,
            passThresholdPct: true,
            testFileContent: true,
          },
        },
        userId: true,
      },
    });

    if (!submission) {
      return;
    }

    try {
      if (!submission.testSuite?.testFileContent) {
        await this.completeMilestoneSubmission(
          submission.id,
          MilestoneSubmissionStatus.ERROR,
          '\n[error]\nGenerated milestone test suite is not available.\n',
        );
        return;
      }

      const executionResult = await this.milestoneExecutionClient.execute({
        repoUrl: submission.repoUrl,
        submissionId: submission.id,
        testFileContent: submission.testSuite.testFileContent,
        timeoutMs: MILESTONE_EXECUTION_TIMEOUT_MS,
      });
      await this.completeMilestoneSubmission(
        submission.id,
        executionResult.status,
        executionResult.outputLog,
        toMilestoneTestResult(executionResult),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown milestone execution error';
      await this.completeMilestoneSubmission(
        submission.id,
        MilestoneSubmissionStatus.ERROR,
        `\n[error]\n${message}\n`,
      );
    }
  }

  async completeMilestoneSubmission(
    submissionId: string,
    status: MilestoneSubmissionStatus,
    outputLog: string,
    testResult?: MilestoneTestResult,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const testResultsJson = testResult
        ? (testResult.testResults.map((test) => ({
            message: test.message,
            name: test.name,
            passed: test.passed,
          })) as Prisma.InputJsonValue)
        : undefined;
      const submissionContext = await tx.milestoneSubmission.findUnique({
        where: { id: submissionId },
        select: {
          createdAt: true,
          roadmapNode: {
            select: {
              roadmapId: true,
            },
          },
          roadmapNodeId: true,
          userId: true,
        },
      });

      if (!submissionContext) {
        return;
      }

      await acquireUserRoadmapLock(
        tx,
        submissionContext.userId,
        submissionContext.roadmapNode.roadmapId,
      );

      const submission = await tx.milestoneSubmission.update({
        where: { id: submissionId },
        data: {
          completedAt: now,
          outputLog: sanitizeMilestoneOutputLog(outputLog),
          passRatePct: testResult?.passRatePct,
          passedTests: testResult?.passedTests,
          status,
          testResults: testResultsJson,
          totalTests: testResult?.totalTests,
        },
        select: {
          createdAt: true,
          roadmapNode: {
            select: {
              roadmapId: true,
            },
          },
          roadmapNodeId: true,
          userId: true,
        },
      });

      if (status !== MilestoneSubmissionStatus.PASSED) {
        return;
      }

      const currentProgress = await tx.userNodeProgress.findUnique({
        where: {
          userId_roadmapNodeId: {
            roadmapNodeId: submission.roadmapNodeId,
            userId: submission.userId,
          },
        },
        select: { startedAt: true, status: true },
      });

      if (
        !currentProgress?.startedAt ||
        submission.createdAt < currentProgress.startedAt ||
        currentProgress.status === NodeStatus.COMPLETED
      ) {
        return;
      }

      await tx.userNodeProgress.update({
        where: {
          userId_roadmapNodeId: {
            roadmapNodeId: submission.roadmapNodeId,
            userId: submission.userId,
          },
        },
        data: {
          completedAt: now,
          status: NodeStatus.COMPLETED,
        },
      });

      await this.roadmapProgress.applyCompletionSideEffects(
        submission.userId,
        submission.roadmapNodeId,
        submission.roadmapNode.roadmapId,
        now,
        tx,
      );
    });
  }

  private async generateOrWaitForMilestoneTestSuite(
    input: MilestoneTestSuiteInput,
  ): Promise<MilestoneTestSuiteRecord> {
    const existingSuite = await this.prisma.milestoneTestSuite.findUnique({
      where: { roadmapNodeId: input.id },
      select: MILESTONE_TEST_SUITE_SELECT,
    });

    if (existingSuite?.status === MilestoneTestSuiteStatus.READY) {
      return existingSuite;
    }

    if (existingSuite?.status === MilestoneTestSuiteStatus.GENERATING) {
      return this.waitForMilestoneTestSuite(input.id);
    }

    const claimed = await this.claimMilestoneTestSuiteGeneration(input.id);

    if (!claimed) {
      return this.waitForMilestoneTestSuite(input.id);
    }

    try {
      return await this.generateAndStoreMilestoneTestSuite(input);
    } catch (err) {
      await this.markMilestoneTestSuiteGenerationFailed(input.id);

      if (err instanceof MilestoneTestSuiteGenerationUnavailableException) {
        throw err;
      }

      this.logger.error(`Failed to generate milestone test suite for node ${input.id}`, err);
      throw new MilestoneTestSuiteGenerationUnavailableException();
    }
  }

  private async claimMilestoneTestSuiteGeneration(roadmapNodeId: string): Promise<boolean> {
    const now = new Date();
    const existingSuite = await this.prisma.milestoneTestSuite.findUnique({
      where: { roadmapNodeId },
      select: { id: true, status: true },
    });

    if (!existingSuite) {
      try {
        await this.prisma.milestoneTestSuite.create({
          data: {
            generationStartedAt: now,
            passThresholdPct: MILESTONE_PASS_THRESHOLD_PCT,
            roadmapNodeId,
            status: MilestoneTestSuiteStatus.GENERATING,
          },
          select: { id: true },
        });
        return true;
      } catch (err) {
        if (this.isPrismaErrorCode(err, 'P2002')) {
          return false;
        }

        throw err;
      }
    }

    if (
      existingSuite.status === MilestoneTestSuiteStatus.READY ||
      existingSuite.status === MilestoneTestSuiteStatus.GENERATING
    ) {
      return false;
    }

    const result = await this.prisma.milestoneTestSuite.updateMany({
      where: {
        roadmapNodeId,
        status: {
          in: [MilestoneTestSuiteStatus.NOT_GENERATED, MilestoneTestSuiteStatus.FAILED],
        },
      },
      data: {
        generatedAt: null,
        generationStartedAt: now,
        status: MilestoneTestSuiteStatus.GENERATING,
      },
    });

    return result.count > 0;
  }

  private async generateAndStoreMilestoneTestSuite(
    input: MilestoneTestSuiteInput,
  ): Promise<MilestoneTestSuiteRecord> {
    const generatedSuite = await this.aiService.generateMilestoneTestSuite({
      name: input.name,
      projectBrief: input.projectBrief,
      roleCategory: input.roleCategory,
    });

    this.assertGeneratedMilestoneTestSuite(generatedSuite);

    return this.prisma.milestoneTestSuite.update({
      where: { roadmapNodeId: input.id },
      data: {
        generatedAt: new Date(),
        generationStartedAt: null,
        passThresholdPct: MILESTONE_PASS_THRESHOLD_PCT,
        status: MilestoneTestSuiteStatus.READY,
        summary: generatedSuite.summary.trim(),
        testCases: generatedSuite.testCases as unknown as Prisma.InputJsonValue,
        testFileContent: generatedSuite.testFileContent.trim(),
        title: generatedSuite.title.trim(),
      },
      select: MILESTONE_TEST_SUITE_SELECT,
    });
  }

  private assertGeneratedMilestoneTestSuite(suite: GeneratedMilestoneTestSuite): void {
    if (suite.testCases.length !== MILESTONE_TEST_SUITE_CASE_COUNT) {
      throw new Error(`Expected ${MILESTONE_TEST_SUITE_CASE_COUNT} generated milestone tests`);
    }

    if (!suite.testFileContent.includes(MILESTONE_RESULT_MARKER)) {
      throw new Error('Generated milestone test file does not emit structured results');
    }
  }

  private async waitForMilestoneTestSuite(
    roadmapNodeId: string,
  ): Promise<MilestoneTestSuiteRecord> {
    const startedAt = Date.now();

    while (Date.now() - startedAt <= MILESTONE_TEST_SUITE_POLL_TIMEOUT_MS) {
      const suite = await this.prisma.milestoneTestSuite.findUnique({
        where: { roadmapNodeId },
        select: MILESTONE_TEST_SUITE_SELECT,
      });

      if (suite?.status === MilestoneTestSuiteStatus.READY) {
        return suite;
      }

      if (suite?.status === MilestoneTestSuiteStatus.FAILED) {
        throw new MilestoneTestSuiteGenerationUnavailableException();
      }

      await delay(MILESTONE_TEST_SUITE_POLL_INTERVAL_MS);
    }

    throw new MilestoneTestSuiteGenerationUnavailableException();
  }

  private async markMilestoneTestSuiteGenerationFailed(roadmapNodeId: string): Promise<void> {
    try {
      await this.prisma.milestoneTestSuite.update({
        where: { roadmapNodeId },
        data: {
          generationStartedAt: null,
          status: MilestoneTestSuiteStatus.FAILED,
        },
      });
    } catch (err) {
      this.logger.error(
        `Failed to mark milestone test suite generation failed for node ${roadmapNodeId}`,
        err,
      );
    }
  }

  private isPrismaErrorCode(error: unknown, code: string): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === code
    );
  }

  private queueMilestoneSubmissionExecution(submissionId: string): void {
    void this.executeMilestoneSubmission(submissionId).catch((error: unknown) => {
      this.logger.error(`Unexpected milestone submission execution error: ${submissionId}`, error);
    });
  }
}
