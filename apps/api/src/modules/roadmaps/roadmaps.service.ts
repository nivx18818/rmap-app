import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { NodeType, type Prisma, type Roadmap } from '@repo/db/prisma/client';

import {
  AppNotFoundException,
  DeadlineInPastException,
  InternalServerErrorException,
  RoadmapGenerationUnavailableException,
  RoadmapNotFoundException,
} from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { GenerateRoadmapDto } from './dto/generate-roadmap.dto';
import type { ListRoadmapsQueryDto } from './dto/list-roadmaps-query.dto';
import type { RoadmapNodesFilterDto } from './dto/roadmap-nodes-filter.dto';
import type { PaginatedRoadmapsResponseDto, RoadmapResponseDto } from './dto/roadmap-response.dto';
import type { AiNode, AiRoadmapOutput, FlatNode } from './types/ai-roadmap.types';
import type { RoadmapNodeQuizResponse } from './types/roadmap-node-quiz.types';
import type { RoadmapNodesListResponse } from './types/roadmap-nodes.types';

import { AiService } from '../ai/ai.service';
import { DagreLayoutService } from './dagre-layout.service';

/** Number of milliseconds in a day. */
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Timeline warning threshold: warn when total > available * (1 + THRESHOLD). */
const FEASIBILITY_THRESHOLD = 0.15;

const LEAF_NODE_TYPES: NodeType[] = [NodeType.REQUIRED, NodeType.OPTIONAL];
const NODE_QUIZ_QUESTION_COUNT = 5;

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

const toNumberOrNull = (value: Prisma.Decimal | number | null) =>
  value === null ? null : Number(value);

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

    if (status && nodeType && !LEAF_NODE_TYPES.includes(nodeType)) {
      return { nodes: [] };
    }

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

      if (!nodeType) {
        where.nodeType = { in: LEAF_NODE_TYPES };
      }
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
      nodes: nodes.map((node) => {
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
      }),
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

      // First group's leaf nodes → IN_PROGRESS
      const firstGroup = flatNodes.find((n) => n.nodeType === 'GROUP');
      if (firstGroup) {
        const firstLeafIds = flatNodes
          .filter(
            (n) =>
              n.tempParentId === firstGroup.tempId &&
              (n.nodeType === 'REQUIRED' || n.nodeType === 'OPTIONAL'),
          )
          .map((n) => n.realId);

        if (firstLeafIds.length > 0) {
          await tx.userNodeProgress.updateMany({
            where: { roadmapNodeId: { in: firstLeafIds } },
            data: { status: 'IN_PROGRESS', startedAt: new Date() },
          });
        }
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
      this.logger.error('Gemini response failed schema validation', { parsed });
      throw new RoadmapGenerationUnavailableException();
    }

    return this.normalizeRoadmapOutput(parsed, skillMap);
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
    if (!node || typeof node !== 'object') return false;
    const n = node as AiNode;

    if (typeof n.name !== 'string') return false;
    if (!['group', 'milestone', 'required', 'optional'].includes(n.nodeType)) return false;

    // Leaf nodes (required/optional) must not have children
    if (n.nodeType === 'required' || n.nodeType === 'optional') {
      if (typeof n.skillId !== 'string') return false;
      if (typeof n.estimatedHours !== 'number') return false;
      if (n.children && n.children.length > 0) return false;
      return true;
    }

    // Milestone nodes must not have children
    if (n.nodeType === 'milestone') {
      if (n.children && n.children.length > 0) return false;
      return true;
    }

    // Group nodes:
    // - Must not have skillId
    // - Must have children
    // - Max depth for groups is 1 (Parent Group at depth 0, Child Group at depth 1)
    if (n.nodeType === 'group') {
      if (n.skillId !== undefined) return false;
      if (!Array.isArray(n.children) || n.children.length === 0) return false;

      // If this is a nested group (depth >= 1), its children MUST be leaf nodes only
      if (depth >= 1) {
        const allChildrenAreLeaves = n.children.every((child) => {
          const c = child;
          return c && (c.nodeType === 'required' || c.nodeType === 'optional');
        });
        if (!allChildrenAreLeaves) return false;
      }

      return n.children.every((child) => this.isValidAiNode(child, depth + 1));
    }

    return false;
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
