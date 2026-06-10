import { Injectable } from '@nestjs/common';
import { Prisma, type RoleCategory } from '@repo/db/prisma/client';

import {
  SkillPrerequisiteAlreadyExistsException,
  SkillPrerequisiteCycleException,
  SkillPrerequisiteNotFoundException,
  SkillPrerequisiteSelfReferenceException,
  SkillNotFoundException,
} from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { CreateSkillPrerequisiteDto } from './dto/admin-skill-prerequisite.dto';
import type { SkillPrerequisiteListResponse } from './types/admin-skill-prerequisite-response.types';
import type { SkillResponse } from './types/admin-skill-response.types';

const SKILL_SELECT = {
  createdAt: true,
  defaultEstimatedHours: true,
  description: true,
  id: true,
  name: true,
  roleCategory: true,
  updatedAt: true,
} satisfies Prisma.SkillSelect;

type DecimalLike = {
  toNumber?: () => number;
  toString: () => string;
};

type SkillRecord = {
  createdAt: Date;
  defaultEstimatedHours: DecimalLike | null | number;
  description: null | string;
  id: string;
  name: string;
  roleCategory: null | RoleCategory;
  updatedAt: Date;
};

type SkillPrerequisitePrismaClient = Pick<PrismaService, 'skill' | 'skillPrerequisite'>;

@Injectable()
export class AdminSkillPrerequisitesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPrerequisites(skillId: string): Promise<SkillPrerequisiteListResponse> {
    await this.findSkillOrThrow(skillId);

    const prerequisites = await this.prisma.skillPrerequisite.findMany({
      orderBy: [{ prerequisiteSkill: { name: 'asc' } }, { prerequisiteSkillId: 'asc' }],
      select: {
        prerequisiteSkill: {
          select: SKILL_SELECT,
        },
      },
      where: { skillId },
    });

    return {
      prerequisites: prerequisites.map((prerequisite) =>
        this.formatSkill(prerequisite.prerequisiteSkill),
      ),
      skillId,
    };
  }

  async createPrerequisite(skillId: string, dto: CreateSkillPrerequisiteDto): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.findSkillOrThrow(skillId, tx);

        if (skillId === dto.prerequisiteSkillId) {
          throw new SkillPrerequisiteSelfReferenceException();
        }

        await this.findSkillOrThrow(dto.prerequisiteSkillId, tx);
        await this.throwIfPrerequisiteExists(skillId, dto.prerequisiteSkillId, tx);
        await this.throwIfPrerequisiteCreatesCycle(skillId, dto.prerequisiteSkillId, tx);

        await tx.skillPrerequisite.create({
          data: {
            prerequisiteSkillId: dto.prerequisiteSkillId,
            skillId,
          },
          select: {
            prerequisiteSkillId: true,
            skillId: true,
          },
        });
      });
    } catch (error) {
      if (this.isPrismaErrorCode(error, 'P2002')) {
        throw new SkillPrerequisiteAlreadyExistsException();
      }

      throw error;
    }
  }

  async deletePrerequisite(skillId: string, prereqSkillId: string): Promise<void> {
    await this.findSkillOrThrow(skillId);
    await this.findSkillOrThrow(prereqSkillId);

    const result = await this.prisma.skillPrerequisite.deleteMany({
      where: {
        prerequisiteSkillId: prereqSkillId,
        skillId,
      },
    });

    if (result.count === 0) {
      throw new SkillPrerequisiteNotFoundException(skillId, prereqSkillId);
    }
  }

  private async findSkillOrThrow(
    skillId: string,
    prisma: Pick<PrismaService, 'skill'> = this.prisma,
  ): Promise<void> {
    const skill = await prisma.skill.findUnique({
      select: { id: true },
      where: { id: skillId },
    });

    if (!skill) {
      throw new SkillNotFoundException(skillId);
    }
  }

  private formatSkill(skill: SkillRecord): SkillResponse {
    return {
      createdAt: skill.createdAt.toISOString(),
      defaultEstimatedHours: this.formatDecimal(skill.defaultEstimatedHours),
      description: skill.description,
      id: skill.id,
      name: skill.name,
      roleCategory: skill.roleCategory,
      updatedAt: skill.updatedAt.toISOString(),
    };
  }

  private formatDecimal(value: DecimalLike | null | number): null | number {
    if (value === null) {
      return null;
    }

    return typeof value === 'number'
      ? value
      : typeof value.toNumber === 'function'
        ? value.toNumber()
        : Number(value.toString());
  }

  private isPrismaErrorCode(
    error: unknown,
    code: string,
  ): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
  }

  private async throwIfPrerequisiteExists(
    skillId: string,
    prerequisiteSkillId: string,
    prisma: SkillPrerequisitePrismaClient,
  ): Promise<void> {
    const existing = await prisma.skillPrerequisite.findUnique({
      select: {
        prerequisiteSkillId: true,
        skillId: true,
      },
      where: {
        skillId_prerequisiteSkillId: {
          prerequisiteSkillId,
          skillId,
        },
      },
    });

    if (existing) {
      throw new SkillPrerequisiteAlreadyExistsException();
    }
  }

  private async throwIfPrerequisiteCreatesCycle(
    skillId: string,
    prerequisiteSkillId: string,
    prisma: SkillPrerequisitePrismaClient,
  ): Promise<void> {
    if (await this.isSkillReachable(prerequisiteSkillId, skillId, prisma)) {
      throw new SkillPrerequisiteCycleException();
    }
  }

  private async isSkillReachable(
    startSkillId: string,
    targetSkillId: string,
    prisma: SkillPrerequisitePrismaClient,
  ): Promise<boolean> {
    const visited = new Set<string>([startSkillId]);
    let frontier = [startSkillId];

    while (frontier.length > 0) {
      const edges = await prisma.skillPrerequisite.findMany({
        select: {
          prerequisiteSkillId: true,
        },
        where: {
          skillId: {
            in: frontier,
          },
        },
      });
      const nextFrontier: string[] = [];

      for (const edge of edges) {
        if (edge.prerequisiteSkillId === targetSkillId) {
          return true;
        }

        if (!visited.has(edge.prerequisiteSkillId)) {
          visited.add(edge.prerequisiteSkillId);
          nextFrontier.push(edge.prerequisiteSkillId);
        }
      }

      frontier = nextFrontier;
    }

    return false;
  }
}
