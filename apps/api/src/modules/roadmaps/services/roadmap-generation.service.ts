import { Injectable, Logger } from '@nestjs/common';

import {
  DeadlineInPastException,
  RoadmapGenerationUnavailableException,
} from '@/common/exceptions/app.exceptions';
import { AiService } from '@/modules/ai/ai.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { GenerateRoadmapDto } from '../dto/generate-roadmap.dto';
import type { AiRoadmapOutput } from '../types/ai-roadmap.types';

import { flattenTree, parseRoadmapResponse } from '../utils/roadmap-generation';
import { calculateDeadlineTimelineWarning, calculateEstimatedWeeks } from '../utils/timeline';
import { DagreLayoutService } from './dagre-layout.service';

@Injectable()
export class RoadmapGenerationService {
  private readonly logger = new Logger(RoadmapGenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly dagreLayout: DagreLayoutService,
  ) {}

  /**
   * Orchestrates roadmap generation end-to-end.
   *
   * Quiz answers are forwarded to AI but never written to the DB.
   */
  async generate(userId: string, dto: GenerateRoadmapDto) {
    const deadline = new Date(dto.deadlineDate);
    deadline.setHours(23, 59, 59, 999);
    if (deadline <= new Date()) {
      throw new DeadlineInPastException();
    }

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

    let aiOutput: AiRoadmapOutput;
    try {
      const responseText = await this.aiService.generateRoadmap({
        goal: dto.goal,
        roleCategory: dto.roleCategory,
        hoursPerDay: dto.hoursPerDay,
        deadlineDate: dto.deadlineDate,
        quizAnswers: dto.quizAnswers,
        skillMap: skills.map((skill) => ({
          id: skill.id,
          name: skill.name,
          defaultEstimatedHours: skill.defaultEstimatedHours
            ? Number(skill.defaultEstimatedHours)
            : null,
        })),
        prerequisites: prerequisites.map((prerequisite) => ({
          skillId: prerequisite.skillId,
          skillName: prerequisite.skill.name,
          prerequisiteSkillId: prerequisite.prerequisiteSkillId,
          prerequisiteSkillName: prerequisite.prerequisiteSkill.name,
        })),
      });

      aiOutput = parseRoadmapResponse(
        responseText,
        skills.map((skill) => ({ id: skill.id, name: skill.name })),
        this.logger,
      );
    } catch (err) {
      if (err instanceof RoadmapGenerationUnavailableException) throw err;
      this.logger.error('Unexpected error during AI roadmap generation', err);
      throw new RoadmapGenerationUnavailableException();
    }

    const counter = { n: 0 };
    const flatNodes = flattenTree(aiOutput.nodes, null, counter);

    const totalGeneratedLeafHours = flatNodes.reduce(
      (total, node) =>
        node.nodeType === 'REQUIRED' || node.nodeType === 'OPTIONAL'
          ? total + (node.estimatedHours ?? 0)
          : total,
      0,
    );
    const estimatedWeeks = calculateEstimatedWeeks(totalGeneratedLeafHours, dto.hoursPerDay);
    const timelineWarning = calculateDeadlineTimelineWarning(
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

    const tempToReal = new Map(flatNodes.map((node) => [node.tempId, node.realId]));
    for (const node of flatNodes) {
      node.realParentId = node.tempParentId ? (tempToReal.get(node.tempParentId) ?? null) : null;
    }

    const layoutMap = this.dagreLayout.computeLayout(flatNodes);

    const roadmap = await this.prisma.$transaction(async (tx) => {
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

      await tx.roadmapNode.createMany({
        data: flatNodes.map((node) => {
          const pos = layoutMap.get(node.tempId)!;
          return {
            id: node.realId,
            roadmapId: created.id,
            parentId: node.realParentId,
            skillId: node.skillId,
            name: node.name,
            nodeType: node.nodeType,
            description: node.description,
            estimatedHours: node.estimatedHours,
            posX: pos.posX,
            posY: pos.posY,
          };
        }),
      });

      await tx.userNodeProgress.createMany({
        data: flatNodes.map((node) => ({
          userId,
          roadmapNodeId: node.realId,
          status: 'LOCKED' as const,
        })),
      });

      return created;
    });

    return { roadmap, timelineWarning };
  }
}
