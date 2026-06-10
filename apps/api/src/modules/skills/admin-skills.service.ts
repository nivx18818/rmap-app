import { Injectable } from '@nestjs/common';
import { Prisma, type RoleCategory } from '@repo/db/prisma/client';

import {
  SkillDeleteReferencedException,
  SkillNameAlreadyExistsException,
  SkillNotFoundException,
} from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type { ListAdminSkillsQueryDto } from './dto/admin-skill-query.dto';
import type { CreateSkillDto, UpdateSkillDto } from './dto/admin-skill.dto';
import type {
  AdminSkillsListResponse,
  SkillDetailResponse,
  SkillResponse,
} from './types/admin-skill-response.types';

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;

const SKILL_SELECT = {
  createdAt: true,
  defaultEstimatedHours: true,
  description: true,
  id: true,
  name: true,
  roleCategory: true,
  updatedAt: true,
} satisfies Prisma.SkillSelect;

const SKILL_DETAIL_SELECT = {
  ...SKILL_SELECT,
  prerequisites: {
    select: {
      prerequisiteSkill: {
        select: {
          name: true,
        },
      },
      prerequisiteSkillId: true,
    },
  },
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

type SkillDetailRecord = SkillRecord & {
  prerequisites: Array<{
    prerequisiteSkill: {
      name: string;
    };
    prerequisiteSkillId: string;
  }>;
};

@Injectable()
export class AdminSkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async listSkills(query: ListAdminSkillsQueryDto): Promise<AdminSkillsListResponse> {
    const page = query.page ?? DEFAULT_PAGE;
    const perPage = query.perPage ?? DEFAULT_PER_PAGE;
    const where = this.buildSkillWhere(query);

    const [skills, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        select: SKILL_SELECT,
        skip: (page - 1) * perPage,
        take: perPage,
        where,
      }),
      this.prisma.skill.count({ where }),
    ]);

    return {
      data: skills.map((skill) => this.formatSkill(skill)),
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async createSkill(dto: CreateSkillDto): Promise<SkillResponse> {
    try {
      const skill = await this.prisma.skill.create({
        data: {
          defaultEstimatedHours: dto.defaultEstimatedHours ?? null,
          description: dto.description ?? null,
          name: dto.name,
          roleCategory: dto.roleCategory,
        },
        select: SKILL_SELECT,
      });

      return this.formatSkill(skill);
    } catch (error) {
      this.throwSkillNameConflictIfNeeded(error, dto.name);
      throw error;
    }
  }

  async getSkill(skillId: string): Promise<SkillDetailResponse> {
    const skill = await this.prisma.skill.findUnique({
      select: SKILL_DETAIL_SELECT,
      where: { id: skillId },
    });

    if (!skill) {
      throw new SkillNotFoundException(skillId);
    }

    return this.formatSkillDetail(skill);
  }

  async updateSkill(skillId: string, dto: UpdateSkillDto): Promise<SkillResponse> {
    await this.findSkillOrThrow(skillId);

    try {
      const skill = await this.prisma.skill.update({
        data: {
          ...(this.hasOwn(dto, 'defaultEstimatedHours')
            ? { defaultEstimatedHours: dto.defaultEstimatedHours ?? null }
            : {}),
          ...(this.hasOwn(dto, 'description') ? { description: dto.description ?? null } : {}),
          ...(this.hasOwn(dto, 'name') ? { name: dto.name } : {}),
          ...(this.hasOwn(dto, 'roleCategory') ? { roleCategory: dto.roleCategory } : {}),
        },
        select: SKILL_SELECT,
        where: { id: skillId },
      });

      return this.formatSkill(skill);
    } catch (error) {
      if (this.isPrismaErrorCode(error, 'P2025')) {
        throw new SkillNotFoundException(skillId);
      }

      this.throwSkillNameConflictIfNeeded(error, dto.name);
      throw error;
    }
  }

  async deleteSkill(skillId: string): Promise<void> {
    await this.findSkillOrThrow(skillId);

    const referencedNode = await this.prisma.roadmapNode.findFirst({
      select: { id: true },
      where: { skillId },
    });

    if (referencedNode) {
      throw new SkillDeleteReferencedException();
    }

    try {
      await this.prisma.skill.delete({
        select: { id: true },
        where: { id: skillId },
      });
    } catch (error) {
      if (this.isPrismaErrorCode(error, 'P2025')) {
        throw new SkillNotFoundException(skillId);
      }

      throw error;
    }
  }

  private buildSkillWhere(query: ListAdminSkillsQueryDto): Prisma.SkillWhereInput {
    const where: Prisma.SkillWhereInput = {};
    const searchQuery = query.q?.trim();

    if (query.roleCategory) {
      where.roleCategory = query.roleCategory;
    }

    if (searchQuery) {
      where.name = {
        contains: searchQuery,
        mode: 'insensitive',
      };
    }

    return where;
  }

  private async findSkillOrThrow(skillId: string): Promise<void> {
    const skill = await this.prisma.skill.findUnique({
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

  private formatSkillDetail(skill: SkillDetailRecord): SkillDetailResponse {
    const orderedPrerequisites = [...skill.prerequisites].sort(
      (a, b) =>
        a.prerequisiteSkill.name.localeCompare(b.prerequisiteSkill.name) ||
        a.prerequisiteSkillId.localeCompare(b.prerequisiteSkillId),
    );

    return {
      ...this.formatSkill(skill),
      prerequisites: orderedPrerequisites.map((prerequisite) => ({
        name: prerequisite.prerequisiteSkill.name,
        skillId: prerequisite.prerequisiteSkillId,
      })),
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

  private hasOwn(object: object, key: string): boolean {
    return Object.hasOwn(object, key) && (object as Record<string, unknown>)[key] !== undefined;
  }

  private isPrismaErrorCode(
    error: unknown,
    code: string,
  ): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
  }

  private throwSkillNameConflictIfNeeded(error: unknown, name: string | undefined): void {
    if (!name || !this.isPrismaErrorCode(error, 'P2002')) {
      return;
    }

    throw new SkillNameAlreadyExistsException(name);
  }
}
