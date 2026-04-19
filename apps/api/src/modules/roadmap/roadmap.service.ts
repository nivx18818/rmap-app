import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoadmapService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoleSlugs(): Promise<string[]> {
    const roles = await this.prisma.role.findMany({
      select: { slug: true },
    });
    return roles.map((r) => r.slug);
  }
}
