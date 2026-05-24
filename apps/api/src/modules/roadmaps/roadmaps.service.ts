import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { NodeStatus, NodeType, type Prisma, type Roadmap } from '@repo/db/prisma/client';

import {
  AppNotFoundException,
  AppBadRequestException,
  DeadlineInPastException,
  InternalServerErrorException,
  InvalidStatusTransitionException,
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
import type { SubmitQuizDto } from './dto/submit-quiz.dto';
import type { UpdateNodeProgressDto } from './dto/update-node-progress.dto';
import type { AiNode, AiRoadmapOutput, FlatNode } from './types/ai-roadmap.types';
import type {
  QuizOption,
  RoadmapNodeQuizResponse,
  SubmitQuizResponse,
} from './types/roadmap-node-quiz.types';
import type {
  NodeDetailResponse,
  RoadmapNodeWithUserProgressResponse,
  RoadmapNodesListResponse,
  UpdateNodeProgressResponse,
} from './types/roadmap-nodes.types';
import type {
  RoadmapProgressSummaryResponse,
  TimelineWarningResponse,
} from './types/roadmap-progress.types';

import { AiService } from '../ai/ai.service';
import { DagreLayoutService } from './dagre-layout.service';

/** Number of milliseconds in a day. */
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Timeline warning threshold: warn when total > available * (1 + THRESHOLD). */
const FEASIBILITY_THRESHOLD = 0.15;

const PACE_WARNING_THRESHOLD_PCT = 15;
const LEAF_NODE_TYPES: NodeType[] = [NodeType.REQUIRED, NodeType.OPTIONAL];
const NODE_QUIZ_QUESTION_COUNT = 5;
const QUIZ_PASSING_SCORE_PCT = 60;
const QUIZ_REVIEW_SUGGESTION = 'You should review this part before continuing.';

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
        skill: {
          select: {
            id: true,
            name: true,
            description: true,
            defaultEstimatedHours: true,
            roleCategory: true,
            resources: {
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
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

    if (!LEAF_NODE_TYPES.includes(node.nodeType) || !node.skill) {
      return {
        node: nodeResponse,
        skill: null,
        resources: null,
        prerequisites: [],
      };
    }

    const orderedResources = [...node.skill.resources].sort(
      (a, b) =>
        Number(b.isPrimary) - Number(a.isPrimary) ||
        a.createdAt.getTime() - b.createdAt.getTime() ||
        a.id - b.id,
    );
    const primaryResources = orderedResources.filter((resource) => resource.isPrimary).slice(0, 2);
    const nonPrimaryResources = orderedResources.filter((resource) => !resource.isPrimary);

    return {
      node: nodeResponse,
      skill: {
        id: node.skill.id,
        name: node.skill.name,
        description: node.skill.description,
        defaultEstimatedHours: toNumberOrNull(node.skill.defaultEstimatedHours),
        roleCategory: node.skill.roleCategory,
      },
      resources: [...primaryResources, ...nonPrimaryResources].map((resource) => ({
        id: resource.id,
        title: resource.title,
        url: resource.url,
        resourceType: resource.resourceType,
        isFree: resource.isFree,
        isPrimary: resource.isPrimary,
      })),
      prerequisites: node.skill.prerequisites.map((prerequisite) => ({
        skillId: prerequisite.prerequisiteSkillId,
        skillName: prerequisite.prerequisiteSkill.name,
      })),
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
      },
    });

    if (!node) {
      throw new AppNotFoundException('Roadmap node not found');
    }

    if (!LEAF_NODE_TYPES.includes(node.nodeType) || !node.skillId) {
      throw new UnprocessableEntityException({
        code: 42200,
        message: 'Quiz is only available for required or optional leaf nodes',
      });
    }

    const questions = await this.prisma.quizQuestion.findMany({
      where: { skillId: node.skillId },
      select: {
        id: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: NODE_QUIZ_QUESTION_COUNT,
    });

    if (questions.length !== NODE_QUIZ_QUESTION_COUNT) {
      this.logger.error(
        `Expected ${NODE_QUIZ_QUESTION_COUNT} quiz questions for skill ` +
          `${node.skillId}, got ${questions.length}`,
      );
      throw new InternalServerErrorException('Quiz question catalog is incomplete for this skill');
    }

    return {
      nodeId: node.id,
      skillId: node.skillId,
      questions: questions.map((question) => ({
        id: question.id,
        questionText: question.questionText,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
      })),
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
      },
    });

    if (!node) {
      throw new AppNotFoundException('Roadmap node not found');
    }

    if (!LEAF_NODE_TYPES.includes(node.nodeType) || !node.skillId) {
      throw new UnprocessableEntityException({
        code: 42200,
        message: 'Quiz is only available for required or optional leaf nodes',
      });
    }

    const questions = await this.prisma.quizQuestion.findMany({
      where: { skillId: node.skillId },
      select: {
        id: true,
        correctOption: true,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: NODE_QUIZ_QUESTION_COUNT,
    });

    if (questions.length !== NODE_QUIZ_QUESTION_COUNT) {
      this.logger.error(
        `Expected ${NODE_QUIZ_QUESTION_COUNT} quiz questions for skill ` +
          `${node.skillId}, got ${questions.length}`,
      );
      throw new InternalServerErrorException('Quiz question catalog is incomplete for this skill');
    }

    this.assertStrictQuizSubmission(
      dto.answers,
      questions.map((question) => question.id),
    );

    const answerByQuestionId = new Map(
      dto.answers.map((answer) => [answer.questionId, answer.selectedOption.toUpperCase()]),
    );
    const results = questions.map((question) => {
      const selectedOption = answerByQuestionId.get(question.id)!;
      const correctOption = question.correctOption.toUpperCase();

      return {
        questionId: question.id,
        selectedOption: toQuizOption(selectedOption),
        correctOption: toQuizOption(correctOption),
        isCorrect: selectedOption === correctOption,
      };
    });
    const correctCount = results.filter((result) => result.isCorrect).length;
    const totalQuestions = questions.length;
    const scorePct = (correctCount / totalQuestions) * 100;
    const passed = scorePct >= QUIZ_PASSING_SCORE_PCT;

    const updatedProgress = await this.prisma.$transaction(async (tx) =>
      tx.userNodeProgress.update({
        where: {
          userId_roadmapNodeId: {
            userId,
            roadmapNodeId: node.id,
          },
        },
        data: {
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
      }),
    );

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
      suggestion: passed ? null : QUIZ_REVIEW_SUGGESTION,
    };
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

      // First group + first required node → IN_PROGRESS
      const firstGroup = flatNodes.find((n) => n.nodeType === 'GROUP');
      const firstRequiredInGroup = firstGroup
        ? flatNodes.find((n) => n.tempParentId === firstGroup.tempId && n.nodeType === 'REQUIRED')
        : undefined;
      const firstRequired =
        firstRequiredInGroup ?? flatNodes.find((n) => n.nodeType === 'REQUIRED');
      const inProgressIds = [firstGroup?.realId, firstRequired?.realId].filter(
        (id): id is string => !!id,
      );

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

  private assertStrictQuizSubmission(
    answers: SubmitQuizDto['answers'],
    expectedQuestionIds: string[],
  ): void {
    if (answers.length !== NODE_QUIZ_QUESTION_COUNT) {
      throw new AppBadRequestException('Quiz submission must include exactly 5 answers');
    }

    const submittedQuestionIds = answers.map((answer) => answer.questionId);
    const uniqueSubmittedQuestionIds = new Set(submittedQuestionIds);

    if (uniqueSubmittedQuestionIds.size !== submittedQuestionIds.length) {
      throw new AppBadRequestException('Quiz submission contains duplicate question answers');
    }

    const expectedQuestionIdSet = new Set(expectedQuestionIds);
    const hasOnlyExpectedQuestions = submittedQuestionIds.every((questionId) =>
      expectedQuestionIdSet.has(questionId),
    );

    if (!hasOnlyExpectedQuestions) {
      throw new AppBadRequestException('Quiz submission contains unknown question answers');
    }
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

      const unlockedNodes: string[] = [];

      if (dto.status === NodeStatus.COMPLETED) {
        if (LEAF_NODE_TYPES.includes(node.nodeType)) {
          const today = new Date(now);
          today.setUTCHours(0, 0, 0, 0);

          await tx.dailyActivity.upsert({
            where: { userId_activityDate: { userId, activityDate: today } },
            create: { userId, activityDate: today, nodesCompleted: 1 },
            update: { nodesCompleted: { increment: 1 } },
          });

          if (node.parentId) {
            await this.cascadeGroupCompletion(
              tx,
              userId,
              roadmapId,
              node.parentId,
              now,
              unlockedNodes,
            );
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
      }

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
