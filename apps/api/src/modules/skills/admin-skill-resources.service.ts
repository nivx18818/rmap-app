import { Injectable } from '@nestjs/common';
import { type Prisma, type Resource } from '@repo/db/prisma/client';

import {
  ResourceNotFoundException,
  SkillNotFoundException,
} from '@/common/exceptions/app.exceptions';
import { PrismaService } from '@/modules/prisma/prisma.service';

import type {
  CreateSkillResourceDto,
  UpdateSkillResourceDto,
} from './dto/admin-skill-resource.dto';
import type {
  SkillResourceListResponse,
  SkillResourceResponse,
} from './types/admin-skill-resource-response.types';

const RESOURCE_SELECT = {
  createdAt: true,
  id: true,
  isFree: true,
  isPrimary: true,
  resourceType: true,
  skillId: true,
  title: true,
  updatedAt: true,
  url: true,
} satisfies Prisma.ResourceSelect;

type SelectedResource = Pick<Resource, keyof typeof RESOURCE_SELECT>;

@Injectable()
export class AdminSkillResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async listResources(skillId: string): Promise<SkillResourceListResponse> {
    await this.findSkillOrThrow(skillId);

    const resources = await this.prisma.resource.findMany({
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      select: RESOURCE_SELECT,
      where: { skillId },
    });

    return {
      resources: resources.map((resource) => this.formatResource(resource)),
      skill_id: skillId,
    };
  }

  async createResource(
    skillId: string,
    dto: CreateSkillResourceDto,
  ): Promise<SkillResourceResponse> {
    const resource = await this.prisma.$transaction(async (tx) => {
      await this.findSkillOrThrow(skillId, tx);

      const isPrimary = dto.isPrimary ?? false;

      return tx.resource.create({
        data: {
          isFree: dto.isFree ?? true,
          isPrimary,
          resourceType: dto.resourceType,
          skillId,
          title: dto.title,
          url: dto.url,
        },
        select: RESOURCE_SELECT,
      });
    });

    return this.formatResource(resource);
  }

  async updateResource(
    skillId: string,
    resourceId: number,
    dto: UpdateSkillResourceDto,
  ): Promise<SkillResourceResponse> {
    const resource = await this.prisma.$transaction(async (tx) => {
      await this.findSkillOrThrow(skillId, tx);
      await this.findResourceOrThrow(skillId, resourceId, tx);

      return tx.resource.update({
        data: {
          ...(this.hasOwn(dto, 'isFree') ? { isFree: dto.isFree } : {}),
          ...(this.hasOwn(dto, 'isPrimary') ? { isPrimary: dto.isPrimary } : {}),
          ...(this.hasOwn(dto, 'resourceType') ? { resourceType: dto.resourceType } : {}),
          ...(this.hasOwn(dto, 'title') ? { title: dto.title } : {}),
          ...(this.hasOwn(dto, 'url') ? { url: dto.url } : {}),
        },
        select: RESOURCE_SELECT,
        where: { id: resourceId },
      });
    });

    return this.formatResource(resource);
  }

  async deleteResource(skillId: string, resourceId: number): Promise<void> {
    await this.findSkillOrThrow(skillId);

    const result = await this.prisma.resource.deleteMany({
      where: {
        id: resourceId,
        skillId,
      },
    });

    if (result.count === 0) {
      throw new ResourceNotFoundException(resourceId);
    }
  }

  private async findResourceOrThrow(
    skillId: string,
    resourceId: number,
    prisma: Pick<PrismaService, 'resource'> = this.prisma,
  ): Promise<SelectedResource> {
    const resource = await prisma.resource.findFirst({
      select: RESOURCE_SELECT,
      where: {
        id: resourceId,
        skillId,
      },
    });

    if (!resource) {
      throw new ResourceNotFoundException(resourceId);
    }

    return resource;
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

  private formatResource(resource: SelectedResource): SkillResourceResponse {
    return {
      createdAt: resource.createdAt.toISOString(),
      id: resource.id,
      isFree: resource.isFree,
      isPrimary: resource.isPrimary,
      resourceType: resource.resourceType,
      skillId: resource.skillId,
      title: resource.title,
      updatedAt: resource.updatedAt.toISOString(),
      url: resource.url,
    };
  }

  private hasOwn(object: object, key: string): boolean {
    return Object.hasOwn(object, key) && (object as Record<string, unknown>)[key] !== undefined;
  }
}
