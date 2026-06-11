import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/modules/prisma/prisma.service';

import type { SyncVersionResponseDto } from './dto/sync-version-response.dto';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async getVersions(): Promise<SyncVersionResponseDto> {
    const [roadmaps, skills, resources] = await this.prisma.$transaction([
      this.prisma.roadmap.aggregate({
        _max: { updatedAt: true },
        where: { isTemplate: true },
      }),
      this.prisma.skill.aggregate({
        _max: { updatedAt: true },
      }),
      this.prisma.resource.aggregate({
        _max: { updatedAt: true },
      }),
    ]);

    return {
      roadmaps: this.formatTimestamp(roadmaps._max.updatedAt),
      skills: this.formatTimestamp(skills._max.updatedAt),
      resources: this.formatTimestamp(resources._max.updatedAt),
    };
  }

  private formatTimestamp(value: Date | null): null | string {
    return value?.toISOString() ?? null;
  }
}
