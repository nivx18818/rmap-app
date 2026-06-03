import { Injectable, Logger } from '@nestjs/common';
import {
  MilestoneSubmissionStatus,
  MilestoneTestSuiteStatus,
  NodeStatus,
  NodeType,
  QuizGenerationStatus,
  ResourceType,
  type Prisma,
  type Roadmap,
} from '@repo/db/prisma/client';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  DeadlineInPastException,
  InternalServerErrorException,
  InvalidStatusTransitionException,
  MilestoneSubmissionInProgressException,
  MilestoneSubmissionInvalidStateException,
  MilestoneSubmissionInvalidUrlException,
  MilestoneTestSuiteGenerationUnavailableException,
  NodeQuizGenerationUnavailableException,
  QuizSubmissionInvalidException,
  QuizNodeNotInProgressException,
  QuizNodeTypeInvalidException,
  QuizNotPassedException,
  RoadmapNodeProgressInvalidUpdateException,
  RoadmapGenerationUnavailableException,
  RoadmapNodeNotFoundException,
  RoadmapNotFoundException,
  UserNodeProgressNotFoundException,
} from '@/common/exceptions/app.exceptions';
import { calculateStreakDays, type StreakActivityRecord } from '@/common/utils/streak-days.util';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { GenerateRoadmapDto } from './dto/generate-roadmap.dto';
import type { ListRoadmapsQueryDto } from './dto/list-roadmaps-query.dto';
import type { RoadmapNodesFilterDto } from './dto/roadmap-nodes-filter.dto';
import type { PaginatedRoadmapsResponseDto, RoadmapResponseDto } from './dto/roadmap-response.dto';
import type { SubmitMilestoneSubmissionDto } from './dto/submit-milestone-submission.dto';
import type { SubmitQuizDto } from './dto/submit-quiz.dto';
import type { UpdateNodeProgressDto } from './dto/update-node-progress.dto';
import type { AiNode, AiRoadmapOutput, FlatNode } from './types/ai-roadmap.types';
import type {
  QuizQuestionPublic,
  QuizOption,
  RoadmapNodeQuizResponse,
  SubmitQuizResponse,
} from './types/roadmap-node-quiz.types';
import type {
  NodeDetailResponse,
  LatestMilestoneSubmissionResponse,
  MilestoneSubmissionEnvelopeResponse,
  MilestoneSubmissionResponse,
  MilestoneSubmissionTestResultResponse,
  RoadmapNodeWithUserProgressResponse,
  RoadmapNodesListResponse,
  StartRoadmapResponse,
  UpdateNodeProgressResponse,
} from './types/roadmap-nodes.types';
import type {
  RoadmapProgressSummaryResponse,
  TimelineWarningResponse,
} from './types/roadmap-progress.types';

import {
  AiService,
  type GeneratedMilestoneTestSuite,
  type GeneratedNodeQuizQuestion,
} from '../ai/ai.service';
import { DagreLayoutService } from './dagre-layout.service';

/** Number of milliseconds in a day. */
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Timeline warning threshold: warn when total > available * (1 + THRESHOLD). */
const FEASIBILITY_THRESHOLD = 0.15;

const PACE_WARNING_THRESHOLD_PCT = 15;
const LEAF_NODE_TYPES: NodeType[] = [NodeType.REQUIRED, NodeType.OPTIONAL];
const NODE_QUIZ_QUESTION_COUNT = 5;
const NODE_QUIZ_BANK_QUESTION_COUNT = 8;
const QUIZ_GENERATION_POLL_TIMEOUT_MS = 45_000;
const QUIZ_GENERATION_POLL_INTERVAL_MS = 1_500;
const QUIZ_PASSING_SCORE_PCT = 60;
const QUIZ_REVIEW_SUGGESTION = 'You should review this part before continuing.';
const NODE_DETAIL_RESOURCE_LIMIT = 2;
const MILESTONE_PASS_THRESHOLD_PCT = 80;
const MILESTONE_TEST_SUITE_CASE_COUNT = 6;
const MILESTONE_TEST_SUITE_POLL_TIMEOUT_MS = 45_000;
const MILESTONE_TEST_SUITE_POLL_INTERVAL_MS = 1_500;
const MILESTONE_TEST_FILE_DIRECTORY = '.rmap';
const MILESTONE_TEST_FILE_NAME = 'milestone-test.mjs';
const MILESTONE_TEST_FILE_RELATIVE_PATH = `${MILESTONE_TEST_FILE_DIRECTORY}/${MILESTONE_TEST_FILE_NAME}`;
const MILESTONE_GENERATED_TEST_COMMAND = `node ${MILESTONE_TEST_FILE_RELATIVE_PATH}`;
const MILESTONE_RESULT_MARKER = 'RMAP_MILESTONE_RESULTS:';
const MILESTONE_TEST_RESULT_NAME_LIMIT = 200;
const MILESTONE_TEST_RESULT_MESSAGE_LIMIT = 1_000;
const MILESTONE_EXECUTION_TIMEOUT_MS = 120_000;
const MILESTONE_OUTPUT_LOG_LIMIT = 20_000;
const MILESTONE_SANDBOX_IMAGE = 'node:22-alpine';
const MILESTONE_SANDBOX_MEMORY = '512m';
const MILESTONE_SANDBOX_CPUS = '1';
const GITHUB_REPO_URL_PATTERN = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
const ESCAPE_CHARACTER = String.fromCharCode(27);
const ANSI_ESCAPE_PATTERN = new RegExp(
  `${ESCAPE_CHARACTER}(?:[@-Z\\\\-_]|\\[[0-?]*[ -/]*[@-~])`,
  'g',
);

const RESOURCE_TYPE_PRIORITY = {
  [ResourceType.YOUTUBE]: 0,
  [ResourceType.DOCS]: 1,
  [ResourceType.COURSE]: 2,
  [ResourceType.ARTICLE]: 3,
} satisfies Record<ResourceType, number>;

const VALID_TRANSITIONS: Record<NodeStatus, NodeStatus[]> = {
  [NodeStatus.LOCKED]: [],
  [NodeStatus.IN_PROGRESS]: [NodeStatus.COMPLETED],
  [NodeStatus.COMPLETED]: [],
};

const ROADMAP_SELECT = {
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

const MILESTONE_SUBMISSION_SELECT = {
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

const MILESTONE_TEST_SUITE_SELECT = {
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

type SelectedRoadmap = Pick<Roadmap, keyof typeof ROADMAP_SELECT>;

type RoadmapTransaction = Awaited<Parameters<Parameters<PrismaService['$transaction']>[0]>[0]>;

type DecimalLike = {
  toNumber?: () => number;
  toString: () => string;
};

type RoadmapNodeWithProgressRecord = {
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

type RoadmapProgressNodeRecord = {
  id: string;
  nodeType: NodeType;
  estimatedHours: Prisma.Decimal | number | null;
  userNodeProgress: Array<{
    status: NodeStatus;
  }>;
};

type DailyActivityRecord = {
  activityDate: Date;
  nodesCompleted: number;
};

type MilestoneSubmissionRecord = {
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

type MilestoneTestSuiteRecord = {
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

type MilestoneTestSuiteInput = {
  id: string;
  name: string;
  projectBrief: string;
  roleCategory: null | string;
};

type MilestoneTestResult = {
  passRatePct: number;
  passedTests: number;
  testResults: MilestoneSubmissionTestResultResponse[];
  totalTests: number;
};

type DockerCommandResult = {
  exitCode: number | null;
  output: string;
  timedOut: boolean;
};
const toNumberOrNull = (value: Prisma.Decimal | number | null) =>
  value === null ? null : Number(value);

const toQuizOption = (value: string): QuizOption => value.toLowerCase() as QuizOption;

@Injectable()
export class RoadmapsService {
  private readonly logger = new Logger(RoadmapsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly dagreLayout: DagreLayoutService,
  ) {}

  private getRoadmapAccessWhere(userId: string, roadmapId: string): Prisma.RoadmapWhereInput {
    return {
      id: roadmapId,
      OR: [{ isTemplate: true }, { isTemplate: false, userId }],
    };
  }

  private getRoadmapRelationAccessWhere(userId: string): Prisma.RoadmapWhereInput {
    return {
      OR: [{ isTemplate: true }, { isTemplate: false, userId }],
    };
  }

  async listUserRoadmaps(
    userId: string,
    query: ListRoadmapsQueryDto,
  ): Promise<PaginatedRoadmapsResponseDto> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const skip = (page - 1) * perPage;
    const where = {
      isTemplate: false,
      userId,
    } satisfies Prisma.RoadmapWhereInput;

    const [roadmaps, total] = await this.prisma.$transaction([
      this.prisma.roadmap.findMany({
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        select: ROADMAP_SELECT,
        skip,
        take: perPage,
        where,
      }),
      this.prisma.roadmap.count({ where }),
    ]);
    const startedAtByRoadmapId = await this.findStartedAtByRoadmapId(
      userId,
      roadmaps.map((roadmap) => roadmap.id),
    );

    return {
      data: roadmaps.map((roadmap) =>
        this.formatRoadmap(roadmap, startedAtByRoadmapId.get(roadmap.id) ?? null),
      ),
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async listNodes(
    userId: string,
    roadmapId: string,
    query: RoadmapNodesFilterDto,
  ): Promise<RoadmapNodesListResponse> {
    const { nodeType, status, q } = query;
    const trimmedQuery = q?.trim();

    const where: Prisma.RoadmapNodeWhereInput = {
      roadmapId,
      roadmap: this.getRoadmapRelationAccessWhere(userId),
    };

    if (nodeType) {
      where.nodeType = nodeType;
    }

    if (status) {
      where.userNodeProgress = {
        some: {
          userId,
          status,
        },
      };
    }

    if (trimmedQuery) {
      where.name = { contains: trimmedQuery, mode: 'insensitive' };
    }

    const nodes = await this.prisma.roadmapNode.findMany({
      where,
      select: {
        id: true,
        roadmapId: true,
        parentId: true,
        skillId: true,
        name: true,
        description: true,
        nodeType: true,
        estimatedHours: true,
        posX: true,
        posY: true,
        userNodeProgress: {
          where: { userId },
          select: {
            id: true,
            roadmapNodeId: true,
            status: true,
            startedAt: true,
            completedAt: true,
            quizScorePct: true,
            quizPassed: true,
          },
        },
      },
    });

    return {
      nodes: nodes.map((node) => this.formatNodeWithProgress(node)),
    };
  }

  async getProgressSummary(
    userId: string,
    roadmapId: string,
  ): Promise<RoadmapProgressSummaryResponse> {
    const roadmap = await this.prisma.roadmap.findFirst({
      where: this.getRoadmapAccessWhere(userId, roadmapId),
      select: {
        deadlineDate: true,
        generatedAt: true,
        hoursPerDay: true,
        id: true,
      },
    });

    if (!roadmap) {
      throw new RoadmapNotFoundException(roadmapId);
    }

    const [nodes, dailyActivities] = await this.prisma.$transaction([
      this.prisma.roadmapNode.findMany({
        where: { roadmapId },
        select: {
          id: true,
          nodeType: true,
          estimatedHours: true,
          userNodeProgress: {
            where: { userId },
            select: { status: true },
          },
        },
      }),
      this.prisma.dailyActivity.findMany({
        where: { userId },
        orderBy: [{ activityDate: 'desc' }, { id: 'asc' }],
        select: {
          activityDate: true,
          nodesCompleted: true,
        },
      }),
    ]);

    const nodesTotal = nodes.length;
    const completedNodes = nodes.filter((node) => this.isNodeCompleted(node));
    const nodesCompleted = completedNodes.length;
    const requiredLeafNodes = nodes.filter((node) => node.nodeType === NodeType.REQUIRED);
    const requiredLeafNodesCompleted = requiredLeafNodes.filter((node) =>
      this.isNodeCompleted(node),
    ).length;
    const completedHours = completedNodes.reduce(
      (total, node) => total + (toNumberOrNull(node.estimatedHours) ?? 0),
      0,
    );
    const totalLeafEstimatedHours = nodes
      .filter((node) => LEAF_NODE_TYPES.includes(node.nodeType))
      .reduce((total, node) => total + (toNumberOrNull(node.estimatedHours) ?? 0), 0);
    const remainingEstimatedHours = Math.max(0, totalLeafEstimatedHours - completedHours);
    const hoursPerDay = toNumberOrNull(roadmap.hoursPerDay);
    const deadlineTimelineWarning =
      roadmap.deadlineDate && hoursPerDay
        ? this.calculateDeadlineTimelineWarning(
            roadmap.deadlineDate,
            hoursPerDay,
            remainingEstimatedHours,
            new Date(),
            'The remaining roadmap estimate',
          )
        : null;

    return {
      roadmapId: roadmap.id,
      completionPct: this.calculatePercent(nodesCompleted, nodesTotal),
      streakDays: calculateStreakDays(dailyActivities as StreakActivityRecord[]),
      skillReadinessPct: this.calculatePercent(
        requiredLeafNodesCompleted,
        requiredLeafNodes.length,
      ),
      nodesTotal,
      nodesCompleted,
      timelineWarning:
        deadlineTimelineWarning ??
        this.calculateTimelineWarning(roadmap.generatedAt, hoursPerDay, completedHours),
    };
  }

  async getNodeDetail(
    userId: string,
    roadmapId: string,
    nodeId: string,
  ): Promise<NodeDetailResponse> {
    const node = await this.prisma.roadmapNode.findFirst({
      where: {
        id: nodeId,
        roadmapId,
        roadmap: this.getRoadmapRelationAccessWhere(userId),
      },
      select: {
        id: true,
        roadmapId: true,
        parentId: true,
        skillId: true,
        name: true,
        description: true,
        nodeType: true,
        estimatedHours: true,
        posX: true,
        posY: true,
        roadmap: {
          select: {
            roleCategory: true,
          },
        },
        userNodeProgress: {
          where: { userId },
          select: {
            id: true,
            roadmapNodeId: true,
            status: true,
            startedAt: true,
            completedAt: true,
            quizScorePct: true,
            quizPassed: true,
          },
        },
        milestoneSubmissions: {
          where: { userId },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: MILESTONE_SUBMISSION_SELECT,
          take: 1,
        },
        milestoneTestSuite: {
          select: MILESTONE_TEST_SUITE_SELECT,
        },
        skill: {
          select: {
            id: true,
            name: true,
            description: true,
            defaultEstimatedHours: true,
            roleCategory: true,
            resources: {
              orderBy: [
                { isPrimary: 'desc' },
                { isFree: 'desc' },
                { createdAt: 'asc' },
                { id: 'asc' },
              ],
              select: {
                id: true,
                createdAt: true,
                title: true,
                url: true,
                resourceType: true,
                isFree: true,
                isPrimary: true,
              },
            },
            prerequisites: {
              select: {
                prerequisiteSkillId: true,
                prerequisiteSkill: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!node) {
      throw new RoadmapNodeNotFoundException(nodeId);
    }

    const nodeResponse = this.formatNodeWithProgress(node);
    const latestSubmission =
      node.nodeType === NodeType.MILESTONE
        ? this.formatMilestoneSubmission(node.milestoneSubmissions[0] ?? null)
        : null;
    const milestoneTestSuite =
      node.nodeType === NodeType.MILESTONE
        ? await this.resolveMilestoneTestSuiteForNodeDetail({
            existingSuite: node.milestoneTestSuite,
            nodeId: node.id,
            nodeName: node.name,
            projectBrief: node.description ?? node.name,
            roleCategory: node.roadmap.roleCategory,
            status: node.userNodeProgress[0]?.status ?? NodeStatus.LOCKED,
          })
        : null;

    if (!LEAF_NODE_TYPES.includes(node.nodeType) || !node.skill) {
      return {
        node: nodeResponse,
        skill: null,
        resources: null,
        prerequisites: [],
        latestSubmission,
        milestoneTestSuite,
      };
    }

    const orderedResources = [...node.skill.resources]
      .sort(
        (a, b) =>
          Number(b.isPrimary) - Number(a.isPrimary) ||
          Number(b.isFree) - Number(a.isFree) ||
          RESOURCE_TYPE_PRIORITY[a.resourceType] - RESOURCE_TYPE_PRIORITY[b.resourceType] ||
          a.createdAt.getTime() - b.createdAt.getTime() ||
          a.id - b.id,
      )
      .slice(0, NODE_DETAIL_RESOURCE_LIMIT);
    const orderedPrerequisites = [...node.skill.prerequisites].sort(
      (a, b) =>
        a.prerequisiteSkill.name.localeCompare(b.prerequisiteSkill.name) ||
        a.prerequisiteSkillId.localeCompare(b.prerequisiteSkillId),
    );

    return {
      node: nodeResponse,
      skill: {
        id: node.skill.id,
        name: node.skill.name,
        description: node.skill.description,
        defaultEstimatedHours: toNumberOrNull(node.skill.defaultEstimatedHours),
        roleCategory: node.skill.roleCategory,
      },
      resources: orderedResources.map((resource) => ({
        id: resource.id,
        title: resource.title,
        url: resource.url,
        resourceType: resource.resourceType,
        isFree: resource.isFree,
        isPrimary: resource.isPrimary,
      })),
      prerequisites: orderedPrerequisites.map((prerequisite) => ({
        skillId: prerequisite.prerequisiteSkillId,
        skillName: prerequisite.prerequisiteSkill.name,
      })),
      latestSubmission,
      milestoneTestSuite,
    };
  }

  async getNodeQuiz(
    userId: string,
    roadmapId: string,
    nodeId: string,
  ): Promise<RoadmapNodeQuizResponse> {
    const node = await this.prisma.roadmapNode.findFirst({
      where: {
        id: nodeId,
        roadmapId,
        roadmap: this.getRoadmapRelationAccessWhere(userId),
      },
      select: {
        id: true,
        nodeType: true,
        skillId: true,
        skill: {
          select: {
            id: true,
            name: true,
            description: true,
            roleCategory: true,
            quizGenerationStatus: true,
          },
        },
        userNodeProgress: {
          where: { userId },
          select: { status: true },
          take: 1,
        },
      },
    });

    if (!node) {
      throw new RoadmapNodeNotFoundException(nodeId);
    }

    if (!LEAF_NODE_TYPES.includes(node.nodeType) || !node.skillId) {
      throw new QuizNodeTypeInvalidException();
    }

    this.assertQuizNodeInProgress(node.userNodeProgress[0]?.status ?? NodeStatus.LOCKED);

    if (!node.skill) {
      throw new InternalServerErrorException('Skill catalog entry is missing for this node');
    }

    const storedQuestions = await this.findReadyPublicQuizQuestions(node.skillId);
    const questions =
      storedQuestions ?? (await this.generateOrWaitForNodeQuizQuestions(node.skill));

    return {
      nodeId: node.id,
      skillId: node.skillId,
      questions,
    };
  }

  async submitNodeQuiz(
    userId: string,
    roadmapId: string,
    nodeId: string,
    dto: SubmitQuizDto,
  ): Promise<SubmitQuizResponse> {
    const node = await this.prisma.roadmapNode.findFirst({
      where: {
        id: nodeId,
        roadmapId,
        roadmap: this.getRoadmapRelationAccessWhere(userId),
      },
      select: {
        id: true,
        nodeType: true,
        skillId: true,
        userNodeProgress: {
          where: { userId },
          select: { status: true },
          take: 1,
        },
      },
    });

    if (!node) {
      throw new RoadmapNodeNotFoundException(nodeId);
    }

    if (!LEAF_NODE_TYPES.includes(node.nodeType) || !node.skillId) {
      throw new QuizNodeTypeInvalidException();
    }

    this.assertQuizNodeInProgress(node.userNodeProgress[0]?.status ?? NodeStatus.LOCKED);

    this.assertStrictQuizSubmission(dto.answers);

    const submittedQuestionIds = dto.answers.map((answer) => answer.questionId);
    const questions = await this.prisma.quizQuestion.findMany({
      where: {
        id: { in: submittedQuestionIds },
        skillId: node.skillId,
      },
      select: {
        id: true,
        correctOption: true,
      },
    });

    const questionById = new Map(questions.map((question) => [question.id, question]));

    if (
      questions.length !== NODE_QUIZ_QUESTION_COUNT ||
      submittedQuestionIds.some((questionId) => !questionById.has(questionId))
    ) {
      throw new QuizSubmissionInvalidException('Quiz submission contains unknown question answers');
    }

    const answerByQuestionId = new Map(
      dto.answers.map((answer) => [answer.questionId, answer.selectedOption.toUpperCase()]),
    );
    const results = dto.answers.map((answer) => {
      const question = questionById.get(answer.questionId)!;
      const selectedOption = answerByQuestionId.get(answer.questionId)!;
      const correctOption = question.correctOption.toUpperCase();

      return {
        questionId: answer.questionId,
        selectedOption: toQuizOption(selectedOption),
        correctOption: toQuizOption(correctOption),
        isCorrect: selectedOption === correctOption,
      };
    });
    const correctCount = results.filter((result) => result.isCorrect).length;
    const totalQuestions = questions.length;
    const scorePct = (correctCount / totalQuestions) * 100;
    const passed = scorePct >= QUIZ_PASSING_SCORE_PCT;

    const { unlockedNodes, updatedProgress } = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const updatedNodeProgress = await tx.userNodeProgress.update({
        where: {
          userId_roadmapNodeId: {
            userId,
            roadmapNodeId: node.id,
          },
        },
        data: {
          status: passed ? NodeStatus.COMPLETED : NodeStatus.IN_PROGRESS,
          ...(passed ? { completedAt: now } : {}),
          quizScorePct: scorePct,
          quizPassed: passed,
        },
        select: {
          id: true,
          roadmapNodeId: true,
          status: true,
          startedAt: true,
          completedAt: true,
          quizScorePct: true,
          quizPassed: true,
        },
      });

      const unlockedNodeIds = passed
        ? await this.applyCompletionSideEffects(userId, node.id, roadmapId, now, tx)
        : [];

      return { unlockedNodes: unlockedNodeIds, updatedProgress: updatedNodeProgress };
    });

    return {
      scorePct,
      passed,
      correctCount,
      totalQuestions,
      results,
      nodeProgress: {
        id: updatedProgress.id,
        roadmapNodeId: updatedProgress.roadmapNodeId,
        status: updatedProgress.status,
        startedAt: updatedProgress.startedAt,
        completedAt: updatedProgress.completedAt,
        quizScorePct: toNumberOrNull(updatedProgress.quizScorePct),
        quizPassed: updatedProgress.quizPassed,
      },
      unlockedNodes,
      suggestion: passed ? null : QUIZ_REVIEW_SUGGESTION,
    };
  }

  async submitMilestoneSubmission(
    userId: string,
    roadmapId: string,
    nodeId: string,
    dto: SubmitMilestoneSubmissionDto,
  ): Promise<MilestoneSubmissionEnvelopeResponse> {
    const repoUrl = dto.repoUrl.trim();

    this.assertMilestoneSubmissionPayload(repoUrl);

    const node = await this.prisma.roadmapNode.findFirst({
      where: {
        id: nodeId,
        roadmapId,
        roadmap: this.getRoadmapRelationAccessWhere(userId),
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
          select: { status: true },
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

    const currentStatus = node.userNodeProgress[0]?.status ?? NodeStatus.LOCKED;

    if (currentStatus === NodeStatus.LOCKED) {
      throw new InvalidStatusTransitionException(currentStatus, NodeStatus.IN_PROGRESS);
    }

    if (currentStatus === NodeStatus.COMPLETED) {
      throw new MilestoneSubmissionInvalidStateException(
        'Completed milestones cannot receive new submissions',
      );
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

    return { submission: this.formatMilestoneSubmission(submission) };
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
        roadmap: this.getRoadmapRelationAccessWhere(userId),
      },
      select: { id: true, nodeType: true },
    });

    if (!node) {
      throw new RoadmapNodeNotFoundException(nodeId);
    }

    if (node.nodeType !== NodeType.MILESTONE) {
      throw new MilestoneSubmissionInvalidStateException(
        'Only milestone nodes have project submissions',
      );
    }

    const submission = await this.prisma.milestoneSubmission.findFirst({
      where: {
        roadmapNodeId: node.id,
        userId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: MILESTONE_SUBMISSION_SELECT,
    });

    return { submission: this.formatMilestoneSubmission(submission) };
  }

  /**
   * Orchestrates roadmap generation end-to-end:
   * 1. Validate deadline
   * 2. Load role skill map from DB
   * 3. Call Gemini AI
   * 4. Flatten AI tree + match skillIds
   * 5. Feasibility check on generated leaf estimates → optional timelineWarning
   * 6. Compute Dagre layout
   * 7. Persist roadmap + nodes + user_node_progress in one transaction
   * 8. Return { roadmap, timelineWarning }
   *
   * Quiz answers are forwarded to AI but NEVER written to the DB.
   */
  async generate(userId: string, dto: GenerateRoadmapDto) {
    // Validate deadline
    const deadline = new Date(dto.deadlineDate);
    deadline.setHours(23, 59, 59, 999); // treat as end-of-day
    if (deadline <= new Date()) {
      throw new DeadlineInPastException();
    }

    // Load role skill map + prerequisites from DB
    const skills = await this.prisma.skill.findMany({
      where: { roleCategory: dto.roleCategory },
      select: { id: true, name: true, defaultEstimatedHours: true },
    });
    const skillIds = skills.map((skill) => skill.id);

    const prerequisites = await this.prisma.skillPrerequisite.findMany({
      where: {
        skillId: { in: skillIds },
        prerequisiteSkillId: { in: skillIds },
      },
      select: {
        skillId: true,
        prerequisiteSkillId: true,
        skill: { select: { name: true } },
        prerequisiteSkill: { select: { name: true } },
      },
    });

    // Call Gemini
    // Quiz answers are forwarded verbatim; never stored.
    let aiOutput: AiRoadmapOutput;
    try {
      const responseText = await this.aiService.generateRoadmap({
        goal: dto.goal,
        roleCategory: dto.roleCategory,
        hoursPerDay: dto.hoursPerDay,
        deadlineDate: dto.deadlineDate,
        quizAnswers: dto.quizAnswers,
        skillMap: skills.map((s) => ({
          id: s.id,
          name: s.name,
          defaultEstimatedHours: s.defaultEstimatedHours ? Number(s.defaultEstimatedHours) : null,
        })),
        prerequisites: prerequisites.map((p) => ({
          skillId: p.skillId,
          skillName: p.skill.name,
          prerequisiteSkillId: p.prerequisiteSkillId,
          prerequisiteSkillName: p.prerequisiteSkill.name,
        })),
      });

      aiOutput = this.parseRoadmapResponse(
        responseText,
        skills.map((s) => ({ id: s.id, name: s.name })),
      );
    } catch (err) {
      if (err instanceof RoadmapGenerationUnavailableException) throw err;
      this.logger.error('Unexpected error during AI roadmap generation', err);
      throw new RoadmapGenerationUnavailableException();
    }

    // Flatten AI tree and preserve AI parent-child relationships
    const counter = { n: 0 };
    const flatNodes = this.flattenTree(aiOutput.nodes, null, counter);

    const totalGeneratedLeafHours = flatNodes.reduce(
      (total, node) =>
        node.nodeType === 'REQUIRED' || node.nodeType === 'OPTIONAL'
          ? total + (node.estimatedHours ?? 0)
          : total,
      0,
    );
    const estimatedWeeks = this.calculateEstimatedWeeks(totalGeneratedLeafHours, dto.hoursPerDay);
    const timelineWarning = this.calculateDeadlineTimelineWarning(
      deadline,
      dto.hoursPerDay,
      totalGeneratedLeafHours,
    );

    if (timelineWarning) {
      this.logger.warn(
        `Generated roadmap timeline warning for user ${userId}: ` +
          `${timelineWarning.paceDeficitPct}% over estimate, ` +
          `~${timelineWarning.estimatedDelayDays} additional days needed`,
      );
    }

    // Resolve realParentId using tempId → realId map
    const tempToReal = new Map(flatNodes.map((n) => [n.tempId, n.realId]));
    for (const node of flatNodes) {
      node.realParentId = node.tempParentId ? (tempToReal.get(node.tempParentId) ?? null) : null;
    }

    // Dagre layout
    const layoutMap = this.dagreLayout.computeLayout(flatNodes);

    // Persist in a single transaction
    const roadmap = await this.prisma.$transaction(async (tx) => {
      // Create roadmap row
      const created = await tx.roadmap.create({
        data: {
          userId,
          roleCategory: dto.roleCategory,
          title: aiOutput.title,
          description: aiOutput.description,
          goalName: dto.goal,
          hoursPerDay: dto.hoursPerDay,
          deadlineDate: deadline,
          estimatedWeeks,
          isTemplate: false,
        },
      });

      // Create all nodes (with Dagre coordinates)
      await tx.roadmapNode.createMany({
        data: flatNodes.map((n) => {
          const pos = layoutMap.get(n.tempId)!;
          return {
            id: n.realId,
            roadmapId: created.id,
            parentId: n.realParentId,
            skillId: n.skillId,
            name: n.name,
            nodeType: n.nodeType,
            description: n.description,
            estimatedHours: n.estimatedHours,
            posX: pos.posX,
            posY: pos.posY,
          };
        }),
      });

      // Create all user_node_progress rows → LOCKED
      await tx.userNodeProgress.createMany({
        data: flatNodes.map((n) => ({
          userId,
          roadmapNodeId: n.realId,
          status: 'LOCKED' as const,
        })),
      });

      return created;
    });

    // Return
    // Quiz answers are NOT in roadmap or any other returned field.
    return { roadmap, timelineWarning };
  }

  // Private helpers
  private flattenTree(
    nodes: AiNode[],
    parentTempId: string | null,
    counter: { n: number },
  ): FlatNode[] {
    const result: FlatNode[] = [];

    for (const node of nodes) {
      const tempId = `t${counter.n++}`;
      const flat: FlatNode = {
        tempId,
        tempParentId: parentTempId,
        realId: crypto.randomUUID(),
        realParentId: null, // resolved after full flatNodes list is built
        name: node.name,
        nodeType: node.nodeType.toUpperCase() as FlatNode['nodeType'],
        description: node.nodeType === 'milestone' ? (node.description ?? null) : null,
        estimatedHours:
          node.nodeType === 'required' || node.nodeType === 'optional'
            ? (node.estimatedHours ?? null)
            : null,
        skillId:
          node.nodeType === 'required' || node.nodeType === 'optional'
            ? (node.skillId ?? null)
            : null,
      };

      result.push(flat);

      if (node.children?.length) {
        result.push(...this.flattenTree(node.children, tempId, counter));
      }
    }

    return result;
  }

  private parseRoadmapResponse(
    text: string,
    skillMap: Array<{ id: string; name: string }>,
  ): AiRoadmapOutput {
    const cleaned = this.stripMarkdownFences(text);
    let parsed: unknown;

    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      this.logger.error('Failed to parse Gemini JSON response', { raw: text, err });
      throw new RoadmapGenerationUnavailableException();
    }

    if (!this.isValidAiRoadmapOutput(parsed)) {
      throw new RoadmapGenerationUnavailableException();
    }

    const normalized = this.normalizeRoadmapOutput(parsed, skillMap);
    if (normalized.nodes.length === 0) {
      this.logger.error('All nodes were filtered out during normalization');
      throw new RoadmapGenerationUnavailableException();
    }

    return normalized;
  }

  private normalizeRoadmapOutput(
    output: AiRoadmapOutput,
    skillMap: Array<{ id: string; name: string }>,
  ): AiRoadmapOutput {
    const validSkillIds = new Set(skillMap.map((s) => s.id));

    const cleanNodes = (nodes: AiNode[]): AiNode[] => {
      return nodes
        .map((node) => {
          if (node.nodeType === 'group' || node.nodeType === 'milestone') {
            const { skillId: _skillId, ...rest } = node;
            return {
              ...rest,
              children: node.children ? cleanNodes(node.children) : [],
            };
          }

          if ((node.nodeType === 'required' || node.nodeType === 'optional') && node.skillId) {
            if (!validSkillIds.has(node.skillId)) {
              this.logger.warn(
                `LLM hallucinated skillId: ${node.skillId}. Matching by name: ${node.name}`,
              );
              const matched = skillMap.find(
                (s) => s.name.toLowerCase() === node.name.toLowerCase(),
              );
              if (matched) {
                node.skillId = matched.id;
              } else {
                this.logger.error(`Could not recover hallucinated skill: ${node.name}`);
              }
            }
          }

          return {
            ...node,
            children: node.children ? cleanNodes(node.children) : [],
          };
        })
        .filter((n) => {
          if (n.nodeType === 'required' || n.nodeType === 'optional') {
            return !!n.skillId;
          }
          if (n.nodeType === 'group') {
            return !!n.children && n.children.length > 0;
          }
          return true;
        });
    };

    return {
      title: output.title,
      description: output.description,
      nodes: cleanNodes(output.nodes),
    };
  }

  private isValidAiRoadmapOutput(payload: unknown): payload is AiRoadmapOutput {
    if (!payload || typeof payload !== 'object') return false;

    const candidate = payload as AiRoadmapOutput;
    if (typeof candidate.title !== 'string') return false;
    if (typeof candidate.description !== 'string') return false;
    if (!Array.isArray(candidate.nodes) || candidate.nodes.length === 0) return false;

    return candidate.nodes.every((node) => this.isValidAiNode(node));
  }

  private isValidAiNode(node: unknown, depth = 0): node is AiNode {
    if (!node || typeof node !== 'object') {
      this.logger.warn(`Validation failed: node is not an object at depth ${depth}`);
      return false;
    }
    const n = node as AiNode;

    if (typeof n.name !== 'string') {
      this.logger.warn(`Validation failed: node name is not a string at depth ${depth}`, { node });
      return false;
    }
    if (!['group', 'milestone', 'required', 'optional'].includes(n.nodeType)) {
      this.logger.warn(`Validation failed: invalid nodeType "${n.nodeType}" at depth ${depth}`, {
        node,
      });
      return false;
    }

    // Leaf nodes (required/optional)
    if (n.nodeType === 'required' || n.nodeType === 'optional') {
      // More permissive: allow null/missing skillId or estimatedHours here,
      // as normalization/recovery happens later. Just ensure they aren't totally wrong types.
      if (n.skillId !== undefined && n.skillId !== null && typeof n.skillId !== 'string') {
        this.logger.warn(`Validation failed: leaf node skillId must be string or null`, { node });
        return false;
      }
      if (
        n.estimatedHours !== undefined &&
        n.estimatedHours !== null &&
        typeof n.estimatedHours !== 'number'
      ) {
        this.logger.warn(`Validation failed: leaf node estimatedHours must be number or null`, {
          node,
        });
        return false;
      }
      if (n.children && Array.isArray(n.children) && n.children.length > 0) {
        this.logger.warn(`Validation failed: leaf nodes cannot have children`, { node });
        return false;
      }
      return true;
    }

    // Milestone nodes
    if (n.nodeType === 'milestone') {
      if (n.children && Array.isArray(n.children) && n.children.length > 0) {
        this.logger.warn(`Validation failed: milestone nodes cannot have children`, { node });
        return false;
      }
      return true;
    }

    // Group nodes
    if (n.nodeType === 'group') {
      if (n.skillId !== undefined && n.skillId !== null) {
        this.logger.warn(`Validation failed: group nodes should not have skillId`, { node });
        return false;
      }
      if (!Array.isArray(n.children) || n.children.length === 0) {
        this.logger.warn(`Validation failed: group nodes must have children`, { node });
        return false;
      }

      // Group nodes cannot contain other group nodes (only leaf nodes are allowed)
      const allChildrenAreLeaves = n.children.every((child) => {
        const c = child;
        return c && (c.nodeType === 'required' || c.nodeType === 'optional');
      });
      if (!allChildrenAreLeaves) {
        this.logger.warn(
          `Validation failed: group nodes must only contain leaf nodes (no nested groups allowed)`,
          {
            node,
          },
        );
        return false;
      }

      return n.children.every((child) => this.isValidAiNode(child, depth + 1));
    }

    return false;
  }

  private formatNodeWithProgress(
    node: RoadmapNodeWithProgressRecord,
  ): RoadmapNodeWithUserProgressResponse {
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
  }

  private formatMilestoneSubmission(
    submission: MilestoneSubmissionRecord,
  ): MilestoneSubmissionResponse;
  private formatMilestoneSubmission(submission: null): null;
  private formatMilestoneSubmission(
    submission: MilestoneSubmissionRecord | null,
  ): MilestoneSubmissionResponse | null;
  private formatMilestoneSubmission(
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
      testResults: this.parseStoredMilestoneTestResults(submission.testResults),
      totalTests: submission.totalTests,
      attemptNumber: submission.attemptNumber,
      createdAt: submission.createdAt.toISOString(),
      completedAt: submission.completedAt?.toISOString() ?? null,
    };
  }

  private parseStoredMilestoneTestResults(
    value: Prisma.JsonValue | null,
  ): MilestoneSubmissionTestResultResponse[] | null {
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
  }

  private formatMilestoneTestSuite(suite: MilestoneTestSuiteRecord | null) {
    if (!suite || suite.status !== MilestoneTestSuiteStatus.READY) {
      return null;
    }

    const testCases = this.parseStoredMilestoneTestCases(suite.testCases);

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
  }

  private parseStoredMilestoneTestCases(testCases: Prisma.JsonValue | null) {
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
  }

  private async resolveMilestoneTestSuiteForNodeDetail(input: {
    existingSuite: MilestoneTestSuiteRecord | null;
    nodeId: string;
    nodeName: string;
    projectBrief: string;
    roleCategory: null | string;
    status: NodeStatus;
  }) {
    const formattedExistingSuite = this.formatMilestoneTestSuite(input.existingSuite);

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

    return this.formatMilestoneTestSuite(suite);
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

      await this.delay(MILESTONE_TEST_SUITE_POLL_INTERVAL_MS);
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

  private assertMilestoneSubmissionPayload(repoUrl: string): void {
    if (!GITHUB_REPO_URL_PATTERN.test(repoUrl)) {
      throw new MilestoneSubmissionInvalidUrlException();
    }
  }

  private queueMilestoneSubmissionExecution(submissionId: string): void {
    void this.executeMilestoneSubmission(submissionId).catch((error: unknown) => {
      this.logger.error(`Unexpected milestone submission execution error: ${submissionId}`, error);
    });
  }

  private async executeMilestoneSubmission(submissionId: string): Promise<void> {
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

    const startedAt = Date.now();
    const workspacePath = await mkdtemp(join(tmpdir(), 'rmap-milestone-'));
    let outputLog = '';

    try {
      if (!submission.testSuite?.testFileContent) {
        outputLog = this.appendOutputLog(
          outputLog,
          '\n[error]\nGenerated milestone test suite is not available.\n',
        );
        await this.completeMilestoneSubmission(
          submission.id,
          MilestoneSubmissionStatus.ERROR,
          outputLog,
        );
        return;
      }

      const cloneResult = await this.runDockerCommand(
        this.buildCloneDockerArgs(submission.id, submission.repoUrl, workspacePath),
        this.remainingMilestoneExecutionMs(startedAt),
        this.buildMilestoneContainerName(submission.id, 'clone'),
      );
      outputLog = this.appendOutputLog(outputLog, this.formatStageOutput('clone', cloneResult));

      if (cloneResult.timedOut || cloneResult.exitCode !== 0) {
        await this.completeMilestoneSubmission(
          submission.id,
          MilestoneSubmissionStatus.ERROR,
          outputLog,
        );
        return;
      }

      const installResult = await this.runDockerCommand(
        this.buildInstallDockerArgs(submission.id, workspacePath),
        this.remainingMilestoneExecutionMs(startedAt),
        this.buildMilestoneContainerName(submission.id, 'install'),
      );
      outputLog = this.appendOutputLog(outputLog, this.formatStageOutput('install', installResult));

      if (installResult.timedOut) {
        await this.completeMilestoneSubmission(
          submission.id,
          MilestoneSubmissionStatus.ERROR,
          outputLog,
        );
        return;
      }

      if (installResult.exitCode !== 0) {
        await this.completeMilestoneSubmission(
          submission.id,
          MilestoneSubmissionStatus.FAILED,
          outputLog,
        );
        return;
      }

      await this.writeMilestoneTestFile(workspacePath, submission.testSuite.testFileContent);
      outputLog = this.appendOutputLog(
        outputLog,
        `\n[inject: ok]\nWrote generated test suite to ${MILESTONE_TEST_FILE_RELATIVE_PATH}\n`,
      );

      const testResult = await this.runDockerCommand(
        this.buildTestDockerArgs(submission.id, workspacePath),
        this.remainingMilestoneExecutionMs(startedAt),
        this.buildMilestoneContainerName(submission.id, 'test'),
      );
      outputLog = this.appendOutputLog(outputLog, this.formatStageOutput('test', testResult));

      if (testResult.timedOut || testResult.exitCode === null) {
        await this.completeMilestoneSubmission(
          submission.id,
          MilestoneSubmissionStatus.ERROR,
          outputLog,
        );
        return;
      }

      const parsedTestResult = this.parseMilestoneTestResult(testResult.output);

      if (!parsedTestResult) {
        outputLog = this.appendOutputLog(
          outputLog,
          '\n[result]\nGenerated tests did not emit structured RMap results.\n',
        );
        await this.completeMilestoneSubmission(
          submission.id,
          MilestoneSubmissionStatus.ERROR,
          outputLog,
        );
        return;
      }

      const finalStatus =
        parsedTestResult.passRatePct >= submission.testSuite.passThresholdPct
          ? MilestoneSubmissionStatus.PASSED
          : MilestoneSubmissionStatus.FAILED;
      outputLog = this.appendOutputLog(
        outputLog,
        this.formatMilestoneTestResultSummary(
          parsedTestResult,
          submission.testSuite.passThresholdPct,
        ),
      );

      await this.completeMilestoneSubmission(
        submission.id,
        finalStatus,
        outputLog,
        parsedTestResult,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown milestone execution error';
      outputLog = this.appendOutputLog(outputLog, `\n[error]\n${message}\n`);

      await this.completeMilestoneSubmission(
        submission.id,
        MilestoneSubmissionStatus.ERROR,
        outputLog,
      );
    } finally {
      await rm(workspacePath, { force: true, recursive: true });
    }
  }

  private buildCloneDockerArgs(
    submissionId: string,
    repoUrl: string,
    workspacePath: string,
  ): string[] {
    return [
      'run',
      '--rm',
      '--name',
      this.buildMilestoneContainerName(submissionId, 'clone'),
      '--memory',
      MILESTONE_SANDBOX_MEMORY,
      '--cpus',
      MILESTONE_SANDBOX_CPUS,
      '-e',
      `REPO_URL=${repoUrl}`,
      '-v',
      `${workspacePath}:/workspace`,
      MILESTONE_SANDBOX_IMAGE,
      'sh',
      '-c',
      'apk add --no-cache git && git clone --depth 1 "$REPO_URL" /workspace/app',
    ];
  }

  private buildInstallDockerArgs(submissionId: string, workspacePath: string): string[] {
    return [
      'run',
      '--rm',
      '--name',
      this.buildMilestoneContainerName(submissionId, 'install'),
      '--memory',
      MILESTONE_SANDBOX_MEMORY,
      '--cpus',
      MILESTONE_SANDBOX_CPUS,
      '-v',
      `${workspacePath}:/workspace`,
      '-w',
      '/workspace/app',
      MILESTONE_SANDBOX_IMAGE,
      'npm',
      'install',
    ];
  }

  private buildTestDockerArgs(submissionId: string, workspacePath: string): string[] {
    return [
      'run',
      '--rm',
      '--name',
      this.buildMilestoneContainerName(submissionId, 'test'),
      '--memory',
      MILESTONE_SANDBOX_MEMORY,
      '--cpus',
      MILESTONE_SANDBOX_CPUS,
      '--network',
      'none',
      '-v',
      `${workspacePath}:/workspace`,
      '-w',
      '/workspace/app',
      MILESTONE_SANDBOX_IMAGE,
      'node',
      MILESTONE_TEST_FILE_RELATIVE_PATH,
    ];
  }

  private async writeMilestoneTestFile(
    workspacePath: string,
    testFileContent: string,
  ): Promise<void> {
    const testDirectoryPath = join(workspacePath, 'app', MILESTONE_TEST_FILE_DIRECTORY);
    await mkdir(testDirectoryPath, { recursive: true });
    await writeFile(join(testDirectoryPath, MILESTONE_TEST_FILE_NAME), testFileContent, 'utf8');
  }

  private buildMilestoneContainerName(submissionId: string, stage: string): string {
    return `rmap-milestone-${submissionId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24)}-${stage}`;
  }

  private remainingMilestoneExecutionMs(startedAt: number): number {
    return Math.max(1, MILESTONE_EXECUTION_TIMEOUT_MS - (Date.now() - startedAt));
  }

  private async runDockerCommand(
    args: string[],
    timeoutMs: number,
    containerName: string,
  ): Promise<DockerCommandResult> {
    const result = await new Promise<DockerCommandResult>((resolve, reject) => {
      const child = spawn('docker', args, { windowsHide: true });
      let output = '';
      let timedOut = false;

      const timeout = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, timeoutMs);

      child.stdout.on('data', (chunk: Buffer) => {
        output = this.appendOutputLog(output, chunk.toString('utf8'));
      });

      child.stderr.on('data', (chunk: Buffer) => {
        output = this.appendOutputLog(output, chunk.toString('utf8'));
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      child.on('close', (exitCode) => {
        clearTimeout(timeout);
        resolve({ exitCode, output, timedOut });
      });
    });

    if (result.timedOut) {
      await this.forceRemoveMilestoneContainer(containerName);
    }

    return result;
  }

  private async forceRemoveMilestoneContainer(containerName: string): Promise<void> {
    await new Promise<void>((resolve) => {
      const child = spawn('docker', ['rm', '-f', containerName], { windowsHide: true });
      child.on('error', () => resolve());
      child.on('close', () => resolve());
    });
  }

  private async completeMilestoneSubmission(
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
      const submission = await tx.milestoneSubmission.update({
        where: { id: submissionId },
        data: {
          completedAt: now,
          outputLog: this.sanitizeMilestoneOutputLog(outputLog),
          passRatePct: testResult?.passRatePct,
          passedTests: testResult?.passedTests,
          status,
          testResults: testResultsJson,
          totalTests: testResult?.totalTests,
        },
        select: {
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
        select: { status: true },
      });

      if (currentProgress?.status === NodeStatus.COMPLETED) {
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

      await this.applyCompletionSideEffects(
        submission.userId,
        submission.roadmapNodeId,
        submission.roadmapNode.roadmapId,
        now,
        tx,
      );
    });
  }

  private formatStageOutput(stage: string, result: DockerCommandResult): string {
    const status = result.timedOut ? 'timed out' : `exit code ${result.exitCode ?? 'unknown'}`;
    return `\n[${stage}: ${status}]\n${result.output}`;
  }

  private parseMilestoneTestResult(output: string): MilestoneTestResult | null {
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

      const sanitizedName = this.sanitizeMilestoneTestResultText(
        name,
        MILESTONE_TEST_RESULT_NAME_LIMIT,
      );
      const sanitizedMessage = this.sanitizeMilestoneTestResultText(
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
      passRatePct: this.roundToTwo((passedTests / totalTests) * 100),
      passedTests,
      testResults,
      totalTests,
    };
  }

  private sanitizeMilestoneTestResultText(value: string, limit: number): string {
    const sanitized = value.replace(ANSI_ESCAPE_PATTERN, '').trim();

    if (sanitized.length <= limit) {
      return sanitized;
    }

    return `${sanitized.slice(0, limit - 3)}...`;
  }

  private formatMilestoneTestResultSummary(
    result: MilestoneTestResult,
    passThresholdPct: number,
  ): string {
    return (
      `\n[result]\n${result.passedTests}/${result.totalTests} generated tests passed ` +
      `(${result.passRatePct}%). Threshold: ${passThresholdPct}%.\n`
    );
  }

  private appendOutputLog(currentLog: string, nextOutput: string): string {
    return this.sanitizeMilestoneOutputLog(`${currentLog}${nextOutput}`);
  }

  private sanitizeMilestoneOutputLog(outputLog: string): string {
    const sanitized = outputLog.replace(ANSI_ESCAPE_PATTERN, '');

    if (sanitized.length <= MILESTONE_OUTPUT_LOG_LIMIT) {
      return sanitized;
    }

    return sanitized.slice(sanitized.length - MILESTONE_OUTPUT_LOG_LIMIT);
  }

  private isNodeCompleted(node: RoadmapProgressNodeRecord): boolean {
    return node.userNodeProgress[0]?.status === NodeStatus.COMPLETED;
  }

  private calculatePercent(completed: number, total: number): number {
    if (total === 0) {
      return 0;
    }

    return this.roundToOne((completed / total) * 100);
  }

  private calculateStreakDays(dailyActivities: DailyActivityRecord[], now = new Date()): number {
    const activeDateKeys = new Set(
      dailyActivities
        .filter((activity) => activity.nodesCompleted > 0)
        .map((activity) => this.toUtcDateKey(activity.activityDate)),
    );
    const todayKey = this.toUtcDateKey(now);
    const startDate = new Date(this.toUtcMidnightMs(now));

    if (!activeDateKeys.has(todayKey)) {
      startDate.setUTCDate(startDate.getUTCDate() - 1);
    }

    let streakDays = 0;
    const cursor = new Date(startDate);

    while (activeDateKeys.has(this.toUtcDateKey(cursor))) {
      streakDays += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    return streakDays;
  }

  private calculateDeadlineTimelineWarning(
    deadline: Date,
    hoursPerDay: number,
    totalEstimatedHours: number,
    now = new Date(),
    messageSubject = 'The generated roadmap estimate',
  ): TimelineWarningResponse | null {
    if (hoursPerDay <= 0 || totalEstimatedHours <= 0) {
      return null;
    }

    const daysUntilDeadline = Math.max(
      1,
      Math.ceil((deadline.getTime() - now.getTime()) / MS_PER_DAY),
    );
    const availableHours = daysUntilDeadline * hoursPerDay;

    if (totalEstimatedHours <= availableHours * (1 + FEASIBILITY_THRESHOLD)) {
      return null;
    }

    const hoursDeficit = totalEstimatedHours - availableHours;
    const paceDeficitPct = this.roundToOne((hoursDeficit / totalEstimatedHours) * 100);
    const estimatedDelayDays = Math.ceil(hoursDeficit / hoursPerDay);

    return {
      isBehind: true,
      paceDeficitPct,
      estimatedDelayDays,
      message:
        `${messageSubject} may not fit your deadline: about ` +
        `${estimatedDelayDays} additional study day(s) needed.`,
    };
  }

  private calculateEstimatedWeeks(totalEstimatedHours: number, hoursPerDay: number): number | null {
    if (totalEstimatedHours <= 0 || hoursPerDay <= 0) {
      return null;
    }

    return Math.max(1, Math.ceil(totalEstimatedHours / (hoursPerDay * 7)));
  }

  private calculateTimelineWarning(
    generatedAt: Date,
    hoursPerDay: number | null,
    completedHours: number,
    now = new Date(),
  ): TimelineWarningResponse | null {
    if (!hoursPerDay || hoursPerDay <= 0 || Number.isNaN(generatedAt.getTime())) {
      return null;
    }

    const daysElapsed = Math.floor(
      (this.toUtcMidnightMs(now) - this.toUtcMidnightMs(generatedAt)) / MS_PER_DAY,
    );

    if (daysElapsed <= 0) {
      return null;
    }

    const plannedHoursElapsed = daysElapsed * hoursPerDay;

    if (plannedHoursElapsed <= 0) {
      return null;
    }

    const hoursDeficit = Math.max(0, plannedHoursElapsed - completedHours);
    const paceDeficitPct = this.roundToOne((hoursDeficit / plannedHoursElapsed) * 100);

    if (paceDeficitPct < PACE_WARNING_THRESHOLD_PCT) {
      return null;
    }

    const estimatedDelayDays = Math.ceil(hoursDeficit / hoursPerDay);

    return {
      isBehind: true,
      paceDeficitPct,
      estimatedDelayDays,
      message:
        `You are ${paceDeficitPct}% behind pace - projected delay is about ` +
        `${estimatedDelayDays} day(s).`,
    };
  }

  private roundToOne(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private roundToTwo(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private toUtcDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private toUtcMidnightMs(date: Date): number {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }

  private async findStartedAtByRoadmapId(
    userId: string,
    roadmapIds: string[],
  ): Promise<Map<string, Date>> {
    if (roadmapIds.length === 0) {
      return new Map();
    }

    const progressRows = await this.prisma.userNodeProgress.findMany({
      where: {
        userId,
        startedAt: { not: null },
        roadmapNode: { roadmapId: { in: roadmapIds } },
      },
      orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
      select: {
        startedAt: true,
        roadmapNode: { select: { roadmapId: true } },
      },
    });

    const startedAtByRoadmapId = new Map<string, Date>();

    for (const progress of progressRows) {
      if (progress.startedAt && !startedAtByRoadmapId.has(progress.roadmapNode.roadmapId)) {
        startedAtByRoadmapId.set(progress.roadmapNode.roadmapId, progress.startedAt);
      }
    }

    return startedAtByRoadmapId;
  }

  private formatRoadmap(
    roadmap: SelectedRoadmap,
    startedAt: Date | null = null,
  ): RoadmapResponseDto {
    return {
      deadlineDate: this.formatDateOnly(roadmap.deadlineDate),
      description: roadmap.description,
      estimatedWeeks: roadmap.estimatedWeeks,
      generatedAt: roadmap.generatedAt.toISOString(),
      goalName: roadmap.goalName,
      hoursPerDay: this.formatDecimal(roadmap.hoursPerDay),
      id: roadmap.id,
      isTemplate: roadmap.isTemplate,
      roleCategory: roadmap.roleCategory,
      startedAt: startedAt?.toISOString() ?? null,
      title: roadmap.title,
      updatedAt: roadmap.updatedAt.toISOString(),
      userId: roadmap.userId,
    };
  }

  private formatDateOnly(date: Date | null): null | string {
    return date ? date.toISOString().slice(0, 10) : null;
  }

  private formatDecimal(value: DecimalLike | null): null | number {
    if (!value) {
      return null;
    }

    return typeof value.toNumber === 'function' ? value.toNumber() : Number(value.toString());
  }

  private stripMarkdownFences(text: string): string {
    const trimmed = text.trim();
    if (trimmed.startsWith('```')) {
      return trimmed
        .replace(/^```(?:json)?/i, '')
        .replace(/```$/, '')
        .trim();
    }
    return trimmed;
  }

  private async findReadyPublicQuizQuestions(
    skillId: string,
  ): Promise<QuizQuestionPublic[] | null> {
    const questionCount = await this.prisma.quizQuestion.count({ where: { skillId } });

    if (questionCount < NODE_QUIZ_QUESTION_COUNT) {
      return null;
    }

    const questions = await this.prisma.quizQuestion.findMany({
      where: { skillId },
      select: {
        id: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    if (questions.length < NODE_QUIZ_QUESTION_COUNT) {
      return null;
    }

    return this.pickRandomQuizQuestions(
      questions.map((question) => ({
        id: question.id,
        questionText: question.questionText,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
      })),
    );
  }

  private async generateOrWaitForNodeQuizQuestions(skill: {
    description: null | string;
    id: string;
    name: string;
    quizGenerationStatus: QuizGenerationStatus;
    roleCategory: null | string;
  }): Promise<QuizQuestionPublic[]> {
    if (skill.quizGenerationStatus === QuizGenerationStatus.GENERATING) {
      return this.waitForNodeQuizQuestions(skill.id);
    }

    const generationGuard = await this.prisma.skill.updateMany({
      where: {
        id: skill.id,
        quizGenerationStatus: { not: QuizGenerationStatus.GENERATING },
      },
      data: {
        quizGeneratedAt: null,
        quizGenerationStartedAt: new Date(),
        quizGenerationStatus: QuizGenerationStatus.GENERATING,
      },
    });

    if (generationGuard.count === 0) {
      return this.waitForNodeQuizQuestions(skill.id);
    }

    try {
      await this.generateAndStoreNodeQuiz(skill);
      const questions = await this.findReadyPublicQuizQuestions(skill.id);

      if (!questions) {
        throw new Error('Generated node quiz was not available after persistence');
      }

      return questions;
    } catch (err) {
      await this.markNodeQuizGenerationFailed(skill.id);
      this.logger.error(`Failed to generate node quiz for skill ${skill.id}`, err);
      throw new NodeQuizGenerationUnavailableException();
    }
  }

  private async generateAndStoreNodeQuiz(skill: {
    description: null | string;
    id: string;
    name: string;
    roleCategory: null | string;
  }): Promise<void> {
    const generatedQuestions = await this.aiService.generateNodeQuiz({
      description: skill.description,
      name: skill.name,
      roleCategory: skill.roleCategory,
    });
    this.assertGeneratedNodeQuiz(generatedQuestions);

    await this.prisma.$transaction([
      this.prisma.quizQuestion.deleteMany({ where: { skillId: skill.id } }),
      this.prisma.quizQuestion.createMany({
        data: generatedQuestions.map((question) => ({
          skillId: skill.id,
          questionText: question.questionText,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          correctOption: question.correctOption,
        })),
      }),
      this.prisma.skill.update({
        where: { id: skill.id },
        data: {
          quizGeneratedAt: new Date(),
          quizGenerationStartedAt: null,
          quizGenerationStatus: QuizGenerationStatus.READY,
        },
      }),
    ]);
  }

  private assertGeneratedNodeQuiz(questions: GeneratedNodeQuizQuestion[]): void {
    if (questions.length !== NODE_QUIZ_BANK_QUESTION_COUNT) {
      throw new Error(`Expected ${NODE_QUIZ_BANK_QUESTION_COUNT} generated quiz questions`);
    }

    for (const question of questions) {
      const fields = [
        question.questionText,
        question.optionA,
        question.optionB,
        question.optionC,
        question.optionD,
        question.correctOption,
      ];

      if (!fields.every((field) => field.trim().length > 0)) {
        throw new Error('Generated quiz question contains an empty field');
      }

      if (!['A', 'B', 'C', 'D'].includes(question.correctOption)) {
        throw new Error('Generated quiz question contains an invalid correct option');
      }
    }
  }

  private async waitForNodeQuizQuestions(skillId: string): Promise<QuizQuestionPublic[]> {
    const startedAt = Date.now();

    while (Date.now() - startedAt <= QUIZ_GENERATION_POLL_TIMEOUT_MS) {
      const questions = await this.findReadyPublicQuizQuestions(skillId);

      if (questions) {
        return questions;
      }

      await this.delay(QUIZ_GENERATION_POLL_INTERVAL_MS);
    }

    throw new NodeQuizGenerationUnavailableException();
  }

  private async markNodeQuizGenerationFailed(skillId: string): Promise<void> {
    try {
      await this.prisma.skill.update({
        where: { id: skillId },
        data: {
          quizGenerationStartedAt: null,
          quizGenerationStatus: QuizGenerationStatus.FAILED,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to mark node quiz generation failed for skill ${skillId}`, err);
    }
  }

  private pickRandomQuizQuestions<T>(questions: T[]): T[] {
    const shuffledQuestions = [...questions];

    for (let index = shuffledQuestions.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      const question = shuffledQuestions[index]!;
      shuffledQuestions[index] = shuffledQuestions[swapIndex]!;
      shuffledQuestions[swapIndex] = question;
    }

    return shuffledQuestions.slice(0, NODE_QUIZ_QUESTION_COUNT);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private assertStrictQuizSubmission(answers: SubmitQuizDto['answers']): void {
    if (answers.length !== NODE_QUIZ_QUESTION_COUNT) {
      throw new QuizSubmissionInvalidException('Quiz submission must include exactly 5 answers');
    }

    const submittedQuestionIds = answers.map((answer) => answer.questionId);
    const uniqueSubmittedQuestionIds = new Set(submittedQuestionIds);

    if (uniqueSubmittedQuestionIds.size !== submittedQuestionIds.length) {
      throw new QuizSubmissionInvalidException(
        'Quiz submission contains duplicate question answers',
      );
    }
  }

  private assertQuizNodeInProgress(status: NodeStatus): void {
    if (status === NodeStatus.IN_PROGRESS) return;

    throw new QuizNodeNotInProgressException();
  }

  async updateNodeProgress(
    userId: string,
    roadmapId: string,
    nodeId: string,
    dto: UpdateNodeProgressDto,
  ): Promise<UpdateNodeProgressResponse> {
    const node = await this.prisma.roadmapNode.findFirst({
      where: { id: nodeId, roadmapId, roadmap: this.getRoadmapRelationAccessWhere(userId) },
      select: { id: true, nodeType: true, parentId: true, posY: true },
    });

    if (!node) {
      throw new RoadmapNodeNotFoundException(nodeId);
    }

    if (node.nodeType === NodeType.GROUP) {
      throw new RoadmapNodeProgressInvalidUpdateException(
        'Group nodes are structural and cannot be manually updated',
      );
    }

    const currentProgress = await this.prisma.userNodeProgress.findUnique({
      where: { userId_roadmapNodeId: { userId, roadmapNodeId: nodeId } },
      select: { status: true, quizPassed: true },
    });

    if (!currentProgress) {
      throw new UserNodeProgressNotFoundException(nodeId);
    }

    const allowed = VALID_TRANSITIONS[currentProgress.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new InvalidStatusTransitionException(currentProgress.status, dto.status);
    }

    if (LEAF_NODE_TYPES.includes(node.nodeType) && dto.status === NodeStatus.COMPLETED) {
      if (!currentProgress.quizPassed) {
        throw new QuizNotPassedException();
      }
    }

    if (node.nodeType === NodeType.MILESTONE && dto.status === NodeStatus.COMPLETED) {
      throw new RoadmapNodeProgressInvalidUpdateException(
        'Milestone completion is automatic after generated tests pass',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      const updatedProgress = await tx.userNodeProgress.update({
        where: { userId_roadmapNodeId: { userId, roadmapNodeId: nodeId } },
        data: {
          status: dto.status,
          ...(dto.status === NodeStatus.IN_PROGRESS ? { startedAt: now } : {}),
          ...(dto.status === NodeStatus.COMPLETED ? { completedAt: now } : {}),
        },
        select: {
          id: true,
          roadmapNodeId: true,
          status: true,
          startedAt: true,
          completedAt: true,
          quizScorePct: true,
          quizPassed: true,
        },
      });

      const unlockedNodes =
        dto.status === NodeStatus.COMPLETED
          ? await this.applyCompletionSideEffects(userId, nodeId, roadmapId, now, tx)
          : [];

      return {
        progress: {
          id: updatedProgress.id,
          roadmapNodeId: updatedProgress.roadmapNodeId,
          status: updatedProgress.status,
          startedAt: updatedProgress.startedAt,
          completedAt: updatedProgress.completedAt,
          quizScorePct: toNumberOrNull(updatedProgress.quizScorePct),
          quizPassed: updatedProgress.quizPassed,
        },
        unlockedNodes,
      };
    });
  }

  private async applyCompletionSideEffects(
    userId: string,
    roadmapNodeId: string,
    roadmapId: string,
    now: Date,
    tx: Awaited<Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0]>,
  ): Promise<string[]> {
    const unlockedNodes: string[] = [];
    const node = await tx.roadmapNode.findFirst({
      where: { id: roadmapNodeId, roadmapId },
      select: { nodeType: true, parentId: true, posY: true },
    });

    if (!node) return unlockedNodes;

    if (LEAF_NODE_TYPES.includes(node.nodeType)) {
      const today = new Date(now);
      today.setUTCHours(0, 0, 0, 0);

      await tx.dailyActivity.upsert({
        where: { userId_activityDate: { userId, activityDate: today } },
        create: { userId, activityDate: today, nodesCompleted: 1 },
        update: { nodesCompleted: { increment: 1 } },
      });

      if (node.parentId) {
        await this.cascadeGroupCompletion(tx, userId, roadmapId, node.parentId, now, unlockedNodes);
      }
    } else if (node.nodeType === NodeType.MILESTONE) {
      await this.unlockNextGroupAfterMilestone(
        tx,
        userId,
        roadmapId,
        node.parentId,
        node.posY,
        now,
        unlockedNodes,
      );
    }

    return unlockedNodes;
  }

  private async cascadeGroupCompletion(
    tx: Awaited<Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0]>,
    userId: string,
    roadmapId: string,
    groupId: string,
    now: Date,
    unlockedNodes: string[],
  ): Promise<void> {
    const requiredChildren = await tx.roadmapNode.findMany({
      where: { parentId: groupId, nodeType: NodeType.REQUIRED },
      select: { id: true },
    });

    if (requiredChildren.length === 0) return;

    const completedCount = await tx.userNodeProgress.count({
      where: {
        userId,
        roadmapNodeId: { in: requiredChildren.map((c) => c.id) },
        status: NodeStatus.COMPLETED,
      },
    });

    if (completedCount < requiredChildren.length) return;

    const group = await tx.roadmapNode.findFirst({
      where: { id: groupId },
      select: { parentId: true, posY: true },
    });

    if (!group) return;

    const groupProgress = await tx.userNodeProgress.findUnique({
      where: { userId_roadmapNodeId: { userId, roadmapNodeId: groupId } },
      select: { status: true },
    });

    if (groupProgress?.status === NodeStatus.COMPLETED) return;

    await tx.userNodeProgress.update({
      where: { userId_roadmapNodeId: { userId, roadmapNodeId: groupId } },
      data: { status: NodeStatus.COMPLETED, completedAt: now },
    });

    await this.unlockGroupLeaves(tx, userId, groupId, now, unlockedNodes);

    const nextSiblings = await tx.roadmapNode.findMany({
      where: {
        roadmapId,
        parentId: group.parentId,
        posY: { gt: group.posY },
      },
      orderBy: [{ posY: 'asc' }, { id: 'asc' }],
      select: { id: true, nodeType: true, posY: true },
      take: 5,
    });

    const firstNext = nextSiblings[0];
    if (!firstNext) return;

    if (firstNext.nodeType === NodeType.MILESTONE) {
      await this.unlockProgressNode(tx, userId, firstNext.id, now, unlockedNodes);
    } else if (firstNext.nodeType === NodeType.GROUP) {
      await this.unlockGroupLeaves(tx, userId, firstNext.id, now, unlockedNodes);
    }
  }

  private async unlockNextGroupAfterMilestone(
    tx: Awaited<Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0]>,
    userId: string,
    roadmapId: string,
    milestoneParentId: string | null,
    milestonePosY: Prisma.Decimal | number,
    now: Date,
    unlockedNodes: string[],
  ): Promise<void> {
    const nextGroup = await tx.roadmapNode.findFirst({
      where: {
        roadmapId,
        parentId: milestoneParentId,
        nodeType: NodeType.GROUP,
        posY: { gt: milestonePosY },
      },
      orderBy: [{ posY: 'asc' }, { id: 'asc' }],
      select: { id: true },
    });

    if (!nextGroup) return;

    await this.unlockGroupLeaves(tx, userId, nextGroup.id, now, unlockedNodes);
  }

  private async unlockProgressNode(
    tx: Awaited<Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0]>,
    userId: string,
    roadmapNodeId: string,
    now: Date,
    unlockedNodes: string[],
  ): Promise<void> {
    const result = await tx.userNodeProgress.updateMany({
      where: { userId, roadmapNodeId, status: NodeStatus.LOCKED },
      data: { status: NodeStatus.IN_PROGRESS, startedAt: now },
    });

    if (result.count > 0) {
      unlockedNodes.push(roadmapNodeId);
    }
  }

  private async unlockGroupLeaves(
    tx: Awaited<Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0]>,
    userId: string,
    groupId: string,
    now: Date,
    unlockedNodes: string[],
  ): Promise<void> {
    const lockedProgress = await tx.userNodeProgress.findMany({
      where: {
        userId,
        status: NodeStatus.LOCKED,
        roadmapNode: { parentId: groupId, nodeType: { in: LEAF_NODE_TYPES } },
      },
      select: { roadmapNodeId: true },
    });

    if (lockedProgress.length === 0) return;

    const leafIds = lockedProgress.map((p) => p.roadmapNodeId);

    await tx.userNodeProgress.updateMany({
      where: { userId, roadmapNodeId: { in: leafIds } },
      data: { status: NodeStatus.IN_PROGRESS, startedAt: now },
    });

    unlockedNodes.push(...leafIds);
  }

  private async unlockInitialRoadmapNodes(
    tx: RoadmapTransaction,
    userId: string,
    roadmapId: string,
    now: Date,
    unlockedNodes: string[],
  ): Promise<void> {
    const firstGroup = await tx.roadmapNode.findFirst({
      where: { roadmapId, nodeType: NodeType.GROUP },
      orderBy: [{ posY: 'asc' }, { id: 'asc' }],
      select: { id: true },
    });

    if (firstGroup) {
      await this.unlockProgressNode(tx, userId, firstGroup.id, now, unlockedNodes);
      await this.unlockGroupLeaves(tx, userId, firstGroup.id, now, unlockedNodes);
      return;
    }

    const firstLeaf = await tx.roadmapNode.findFirst({
      where: { roadmapId, nodeType: { in: LEAF_NODE_TYPES } },
      orderBy: [{ posY: 'asc' }, { id: 'asc' }],
      select: { id: true },
    });

    if (firstLeaf) {
      await this.unlockProgressNode(tx, userId, firstLeaf.id, now, unlockedNodes);
    }
  }

  private async ensureUserRoadmapProgressRows(
    tx: RoadmapTransaction,
    userId: string,
    roadmapId: string,
  ): Promise<void> {
    const nodes = await tx.roadmapNode.findMany({
      where: { roadmapId },
      select: { id: true },
    });

    if (nodes.length === 0) {
      return;
    }

    await tx.userNodeProgress.createMany({
      data: nodes.map((node) => ({
        userId,
        roadmapNodeId: node.id,
        status: NodeStatus.LOCKED,
      })),
      skipDuplicates: true,
    });
  }

  async getByIdForOwner(userId: string, roadmapId: string): Promise<RoadmapResponseDto> {
    const roadmap = await this.prisma.roadmap.findFirst({
      select: ROADMAP_SELECT,
      where: this.getRoadmapAccessWhere(userId, roadmapId),
    });

    if (!roadmap) {
      throw new RoadmapNotFoundException(roadmapId);
    }

    const startedAtByRoadmapId = await this.findStartedAtByRoadmapId(userId, [roadmap.id]);

    return this.formatRoadmap(roadmap, startedAtByRoadmapId.get(roadmap.id) ?? null);
  }

  async startLearning(userId: string, roadmapId: string): Promise<StartRoadmapResponse> {
    return this.prisma.$transaction(async (tx) => {
      const roadmap = await tx.roadmap.findFirst({
        select: ROADMAP_SELECT,
        where: this.getRoadmapAccessWhere(userId, roadmapId),
      });

      if (!roadmap) {
        throw new RoadmapNotFoundException(roadmapId);
      }

      const existingStartedProgress = await tx.userNodeProgress.findFirst({
        where: {
          userId,
          startedAt: { not: null },
          roadmapNode: { roadmapId: roadmap.id },
        },
        orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
        select: { startedAt: true },
      });

      if (existingStartedProgress?.startedAt) {
        return {
          roadmap: this.formatRoadmap(roadmap, existingStartedProgress.startedAt),
          unlockedNodes: [],
        };
      }

      const now = new Date();
      const unlockedNodes: string[] = [];

      await this.ensureUserRoadmapProgressRows(tx, userId, roadmap.id);
      await this.unlockInitialRoadmapNodes(tx, userId, roadmap.id, now, unlockedNodes);

      return {
        roadmap: this.formatRoadmap(roadmap, now),
        unlockedNodes,
      };
    });
  }

  async deleteByIdForOwner(userId: string, roadmapId: string): Promise<void> {
    const result = await this.prisma.roadmap.deleteMany({
      where: {
        id: roadmapId,
        isTemplate: false,
        userId,
      },
    });

    if (result.count === 0) {
      throw new RoadmapNotFoundException(roadmapId);
    }
  }
}
