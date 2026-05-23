import { Injectable, Logger } from '@nestjs/common';
import {
  MilestoneSubmissionStatus,
  NodeStatus,
  NodeType,
  QuizGenerationStatus,
  ResourceType,
  type Prisma,
  type Roadmap,
} from '@repo/db/prisma/client';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  AppBadRequestException,
  DeadlineInPastException,
  InternalServerErrorException,
  InvalidStatusTransitionException,
  MilestoneSubmissionInProgressException,
  MilestoneSubmissionInvalidCommandException,
  MilestoneSubmissionInvalidUrlException,
  MilestoneTestsNotPassedException,
  NodeQuizGenerationUnavailableException,
  QuizNodeNotInProgressException,
  QuizNodeTypeInvalidException,
  QuizNotPassedException,
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
  RoadmapNodeWithUserProgressResponse,
  RoadmapNodesListResponse,
  UpdateNodeProgressResponse,
} from './types/roadmap-nodes.types';
import type {
  RoadmapProgressSummaryResponse,
  TimelineWarningResponse,
} from './types/roadmap-progress.types';

import { AiService, type GeneratedNodeQuizQuestion } from '../ai/ai.service';
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
const DEFAULT_MILESTONE_TEST_COMMAND = 'npm test';
const MILESTONE_EXECUTION_TIMEOUT_MS = 120_000;
const MILESTONE_OUTPUT_LOG_LIMIT = 20_000;
const MILESTONE_SANDBOX_IMAGE = 'node:22-alpine';
const MILESTONE_SANDBOX_MEMORY = '512m';
const MILESTONE_SANDBOX_CPUS = '1';
const GITHUB_REPO_URL_PATTERN = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
const MILESTONE_TEST_COMMAND_PATTERN = /^npm (test|run [a-zA-Z0-9_-]+)$/;
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
  testCommand: true,
  status: true,
  outputLog: true,
  attemptNumber: true,
  createdAt: true,
  completedAt: true,
} satisfies Prisma.MilestoneSubmissionSelect;

type SelectedRoadmap = Pick<Roadmap, keyof typeof ROADMAP_SELECT>;

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
  testCommand: string;
  status: MilestoneSubmissionStatus;
  outputLog: string | null;
  attemptNumber: number;
  createdAt: Date;
  completedAt: Date | null;
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

    return {
      data: roadmaps.map((roadmap) => this.formatRoadmap(roadmap)),
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
      roadmap: { userId },
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
      where: {
        id: roadmapId,
        isTemplate: false,
        userId,
      },
      select: {
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
    const hoursPerDay = toNumberOrNull(roadmap.hoursPerDay);

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
      timelineWarning: this.calculateTimelineWarning(
        roadmap.generatedAt,
        hoursPerDay,
        completedHours,
      ),
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
        roadmap: { userId },
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

    if (!LEAF_NODE_TYPES.includes(node.nodeType) || !node.skill) {
      return {
        node: nodeResponse,
        skill: null,
        resources: null,
        prerequisites: [],
        latestSubmission,
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
        roadmap: { userId },
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
        roadmap: { userId },
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
      throw new AppBadRequestException('Quiz submission contains unknown question answers');
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
    const testCommand = dto.testCommand?.trim() || DEFAULT_MILESTONE_TEST_COMMAND;

    this.assertMilestoneSubmissionPayload(repoUrl, testCommand);

    const node = await this.prisma.roadmapNode.findFirst({
      where: {
        id: nodeId,
        roadmapId,
        roadmap: { userId },
      },
      select: {
        id: true,
        nodeType: true,
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
      throw new AppBadRequestException('Only milestone nodes can receive project submissions');
    }

    const currentStatus = node.userNodeProgress[0]?.status ?? NodeStatus.LOCKED;

    if (currentStatus === NodeStatus.LOCKED) {
      throw new InvalidStatusTransitionException(currentStatus, NodeStatus.IN_PROGRESS);
    }

    if (currentStatus === NodeStatus.COMPLETED) {
      throw new AppBadRequestException('Completed milestones cannot receive new submissions');
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
          testCommand,
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
        roadmap: { userId },
      },
      select: { id: true, nodeType: true },
    });

    if (!node) {
      throw new RoadmapNodeNotFoundException(nodeId);
    }

    if (node.nodeType !== NodeType.MILESTONE) {
      throw new AppBadRequestException('Only milestone nodes have project submissions');
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
   * 3. Feasibility check → optional timelineWarning
   * 4. Call Gemini AI
   * 5. Flatten AI tree + match skillIds
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

    // Feasibility check
    const totalHours = skills.reduce((sum, s) => sum + Number(s.defaultEstimatedHours ?? 0), 0);
    const nowMs = Date.now();
    const days = Math.max(1, Math.ceil((deadline.getTime() - nowMs) / MS_PER_DAY));
    const availableHours = days * dto.hoursPerDay;

    let timelineWarning: {
      isBehind: boolean;
      paceDeficitPct: number;
      estimatedDelayDays: number;
      message: string;
    } | null = null;

    if (totalHours > availableHours * (1 + FEASIBILITY_THRESHOLD)) {
      const deficit = totalHours - availableHours;
      const paceDeficitPct = Math.round((deficit / totalHours) * 1000) / 10;
      const estimatedDelayDays = Math.ceil(deficit / dto.hoursPerDay);
      timelineWarning = {
        isBehind: true,
        paceDeficitPct,
        estimatedDelayDays,
        message: `You may not finish on time — estimated ${estimatedDelayDays} day(s) behind deadline.`,
      };
      this.logger.warn(
        `Timeline warning for user ${userId}: ${paceDeficitPct}% behind, ~${estimatedDelayDays} days delay`,
      );
    }

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

      // First group + all leaf nodes inside it → IN_PROGRESS
      const firstGroup = flatNodes.find((n) => n.nodeType === 'GROUP');
      const firstGroupLeafIds = firstGroup
        ? flatNodes
            .filter(
              (n) =>
                n.tempParentId === firstGroup.tempId &&
                (n.nodeType === 'REQUIRED' || n.nodeType === 'OPTIONAL'),
            )
            .map((n) => n.realId)
        : [];
      const firstLeaf = flatNodes.find(
        (n) => n.nodeType === 'REQUIRED' || n.nodeType === 'OPTIONAL',
      );
      const inProgressIds = (
        firstGroup ? [firstGroup.realId, ...firstGroupLeafIds] : [firstLeaf?.realId]
      ).filter((id): id is string => !!id);

      if (inProgressIds.length > 0) {
        await tx.userNodeProgress.updateMany({
          where: { roadmapNodeId: { in: inProgressIds } },
          data: { status: 'IN_PROGRESS', startedAt: new Date() },
        });
      }

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

      // If this is a nested group (depth >= 1), its children MUST be leaf nodes only
      if (depth >= 1) {
        const allChildrenAreLeaves = n.children.every((child) => {
          const c = child;
          return c && (c.nodeType === 'required' || c.nodeType === 'optional');
        });
        if (!allChildrenAreLeaves) {
          this.logger.warn(
            `Validation failed: nested group (depth ${depth}) must only have leaves`,
            {
              node,
            },
          );
          return false;
        }
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
      testCommand: submission.testCommand,
      status: submission.status,
      outputLog: submission.outputLog,
      attemptNumber: submission.attemptNumber,
      createdAt: submission.createdAt.toISOString(),
      completedAt: submission.completedAt?.toISOString() ?? null,
    };
  }

  private assertMilestoneSubmissionPayload(repoUrl: string, testCommand: string): void {
    if (!GITHUB_REPO_URL_PATTERN.test(repoUrl)) {
      throw new MilestoneSubmissionInvalidUrlException();
    }

    if (!MILESTONE_TEST_COMMAND_PATTERN.test(testCommand)) {
      throw new MilestoneSubmissionInvalidCommandException();
    }
  }

  private parseMilestoneTestCommand(testCommand: string): string[] {
    if (testCommand === DEFAULT_MILESTONE_TEST_COMMAND) {
      return ['npm', 'test'];
    }

    const npmRunMatch = /^npm run ([a-zA-Z0-9_-]+)$/.exec(testCommand);
    if (!npmRunMatch) {
      throw new MilestoneSubmissionInvalidCommandException();
    }

    return ['npm', 'run', npmRunMatch[1]!];
  }

  private async assertMilestoneCompletionAllowed(
    userId: string,
    roadmapNodeId: string,
    forceComplete: boolean,
  ): Promise<void> {
    const latestSubmission = await this.prisma.milestoneSubmission.findFirst({
      where: { roadmapNodeId, userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { status: true },
    });

    if (latestSubmission?.status === MilestoneSubmissionStatus.PASSED) {
      return;
    }

    if (latestSubmission?.status === MilestoneSubmissionStatus.ERROR && forceComplete) {
      return;
    }

    if (latestSubmission?.status === MilestoneSubmissionStatus.ERROR) {
      throw new MilestoneTestsNotPassedException(
        'Milestone test execution errored. Retry submission or force completion after manual review.',
      );
    }

    throw new MilestoneTestsNotPassedException();
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
        testCommand: true,
      },
    });

    if (!submission) {
      return;
    }

    const startedAt = Date.now();
    const workspacePath = await mkdtemp(join(tmpdir(), 'rmap-milestone-'));
    let outputLog = '';

    try {
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

      const testResult = await this.runDockerCommand(
        this.buildTestDockerArgs(submission.id, workspacePath, submission.testCommand),
        this.remainingMilestoneExecutionMs(startedAt),
        this.buildMilestoneContainerName(submission.id, 'test'),
      );
      outputLog = this.appendOutputLog(outputLog, this.formatStageOutput('test', testResult));

      const finalStatus =
        testResult.timedOut || testResult.exitCode === null
          ? MilestoneSubmissionStatus.ERROR
          : testResult.exitCode === 0
            ? MilestoneSubmissionStatus.PASSED
            : MilestoneSubmissionStatus.FAILED;

      await this.completeMilestoneSubmission(submission.id, finalStatus, outputLog);
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

  private buildTestDockerArgs(
    submissionId: string,
    workspacePath: string,
    testCommand: string,
  ): string[] {
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
      ...this.parseMilestoneTestCommand(testCommand),
    ];
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
  ): Promise<void> {
    await this.prisma.milestoneSubmission.update({
      where: { id: submissionId },
      data: {
        completedAt: new Date(),
        outputLog: this.sanitizeMilestoneOutputLog(outputLog),
        status,
      },
    });
  }

  private formatStageOutput(stage: string, result: DockerCommandResult): string {
    const status = result.timedOut ? 'timed out' : `exit code ${result.exitCode ?? 'unknown'}`;
    return `\n[${stage}: ${status}]\n${result.output}`;
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

  private calculateTimelineWarning(
    generatedAt: Date,
    hoursPerDay: number | null,
    completedHours: number,
    now = new Date(),
  ): TimelineWarningResponse | null {
    if (!hoursPerDay || hoursPerDay <= 0 || Number.isNaN(generatedAt.getTime())) {
      return null;
    }

    const daysElapsed =
      Math.max(
        1,
        Math.floor((this.toUtcMidnightMs(now) - this.toUtcMidnightMs(generatedAt)) / MS_PER_DAY) +
          1,
      ) || 1;
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

  private toUtcDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private toUtcMidnightMs(date: Date): number {
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }

  private formatRoadmap(roadmap: SelectedRoadmap): RoadmapResponseDto {
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
      throw new AppBadRequestException('Quiz submission must include exactly 5 answers');
    }

    const submittedQuestionIds = answers.map((answer) => answer.questionId);
    const uniqueSubmittedQuestionIds = new Set(submittedQuestionIds);

    if (uniqueSubmittedQuestionIds.size !== submittedQuestionIds.length) {
      throw new AppBadRequestException('Quiz submission contains duplicate question answers');
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
      where: { id: nodeId, roadmapId, roadmap: { userId } },
      select: { id: true, nodeType: true, parentId: true, posY: true },
    });

    if (!node) {
      throw new RoadmapNodeNotFoundException(nodeId);
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
      if (currentProgress.quizPassed !== null) {
        throw new AppBadRequestException('Milestone nodes skip quiz validation');
      }

      await this.assertMilestoneCompletionAllowed(userId, nodeId, dto.forceComplete === true);
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

  async getByIdForOwner(userId: string, roadmapId: string): Promise<RoadmapResponseDto> {
    const roadmap = await this.prisma.roadmap.findFirst({
      select: ROADMAP_SELECT,
      where: {
        id: roadmapId,
        isTemplate: false,
        userId,
      },
    });

    if (!roadmap) {
      throw new RoadmapNotFoundException(roadmapId);
    }

    return this.formatRoadmap(roadmap);
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
