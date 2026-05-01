import { Injectable, Logger } from '@nestjs/common';

import {
  DeadlineInPastException,
  RoadmapGenerationUnavailableException,
} from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { GenerateRoadmapDto } from './dto/generate-roadmap.dto';
import type { AiNode, AiRoadmapOutput, FlatNode } from './types/ai-roadmap.types';

import { AiRoadmapService } from './ai-roadmap.service';
import { DagreLayoutService } from './dagre-layout.service';

/** Number of calendar days in a day. */
const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Timeline warning threshold: warn when total > available × (1 + THRESHOLD). */
const FEASIBILITY_THRESHOLD = 0.15;

@Injectable()
export class RoadmapsService {
  private readonly logger = new Logger(RoadmapsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiRoadmapService: AiRoadmapService,
    private readonly dagreLayout: DagreLayoutService,
  ) {}

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
    // ── Step 1: Validate deadline ──────────────────────────────────────────
    const deadline = new Date(dto.deadlineDate);
    deadline.setHours(23, 59, 59, 999); // treat as end-of-day
    if (deadline <= new Date()) {
      throw new DeadlineInPastException();
    }

    // ── Step 2: Load role skill map + prerequisites from DB ────────────────
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

    // ── Step 3: Feasibility check (FR-03, FR-15) ───────────────────────────
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

    // ── Step 4: Call Gemini ────────────────────────────────────────────────
    // Quiz answers are forwarded verbatim; never stored.
    let aiOutput: AiRoadmapOutput;
    try {
      aiOutput = await this.aiRoadmapService.generateRoadmap({
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

      // this.logger.log('AI roadmap generated successfully', aiOutput);
    } catch (err) {
      if (err instanceof RoadmapGenerationUnavailableException) throw err;
      this.logger.error('Unexpected error during AI roadmap generation', err);
      throw new RoadmapGenerationUnavailableException();
    }

    // ── Step 5: Flatten AI tree and preserve AI parent-child relationships ─
    const counter = { n: 0 };
    const flatNodes = this.flattenTree(aiOutput.nodes, null, counter);

    // Resolve realParentId using tempId → realId map
    const tempToReal = new Map(flatNodes.map((n) => [n.tempId, n.realId]));
    for (const node of flatNodes) {
      node.realParentId = node.tempParentId ? (tempToReal.get(node.tempParentId) ?? null) : null;
    }

    // ── Step 6: Dagre layout ────────────────────────────────────────────────
    const layoutMap = this.dagreLayout.computeLayout(flatNodes);

    // ── Step 7: Persist in a single transaction ─────────────────────────────
    const roadmap = await this.prisma.$transaction(async (tx) => {
      // a) Create roadmap row
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

      // b) Create all nodes (with Dagre coordinates)
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

      // c) Create all user_node_progress rows → LOCKED
      await tx.userNodeProgress.createMany({
        data: flatNodes.map((n) => ({
          userId,
          roadmapNodeId: n.realId,
          status: 'LOCKED' as const,
        })),
      });

      // d) First group's leaf nodes → IN_PROGRESS (FR-08)
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

    // ── Step 8: Return ─────────────────────────────────────────────────────
    // Quiz answers are NOT in roadmap or any other returned field.
    return { roadmap, timelineWarning };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

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
}
